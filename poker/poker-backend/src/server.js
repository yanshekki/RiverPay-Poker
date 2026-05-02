require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const Room = require('./game/Room');
const { generateClaimSignature, executeSweep, verifyDepositTransaction } = require('./services/web3');
const redisService = require('./services/redis');
const { validate } = require('./middleware/validate');
const dto = require('./dto');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Config from .env ───
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use('/auth', authRoutes);

// ─── REST API: Room history ───
app.get('/api/my-rooms', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const history = await prisma.roomPlayer.findMany({
            where: { userId: decoded.userId },
            include: { room: true },
            orderBy: { joinedAt: 'desc' },
        });
        res.json(history.map(h => h.room));
    } catch (error) {
        console.error('Failed to fetch room history:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ─── Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 1e8,
});

const rooms = new Map();
const roomContracts = new Map();
const userCurrentRoom = new Map();

// Socket auth middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        socket.user = decoded;
        next();
    });
});

// Socket DTO validation helper
const validateEvent = (schema, handler) => async (data, ack) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.warn('Validation:', result.error.issues.map(i => i.message).join(', '));
        return;
    }
    return handler(result.data, ack);
};

// Load active games from Redis on startup
(async () => {
    const activeGames = await redisService.getActiveGames();
    console.log(`Restoring ${activeGames.length} active games from Redis`);
    for (const roomId of activeGames) {
        const contract = await redisService.getRoomContract(roomId);
        if (contract) roomContracts.set(roomId, contract);
    }
})();

// ─── Connection handler ───
io.on('connection', async (socket) => {
    console.log(`Player online: ${socket.user.walletAddress}`);
    await redisService.setUserOnline(socket.user.userId, socket.id, '');

    // Reconnection check
    const existingRoomId = userCurrentRoom.get(socket.user.userId)
        || await redisService.getUserRoom(socket.user.userId);
    if (existingRoomId && rooms.has(existingRoomId)) {
        socket.join(existingRoomId);
        const currentContract = roomContracts.get(existingRoomId)
            || await redisService.getRoomContract(existingRoomId);
        if (currentContract) socket.emit('roomContractInfo', { contractAddress: currentContract });
        broadcastGameState(existingRoomId);
    }

    // ─── roomCreated ───
    socket.on('roomCreated', validateEvent(dto.roomCreatedSchema, async ({ roomId, contractAddress, settings }) => {
        roomContracts.set(roomId, contractAddress);
        await redisService.cacheRoomContract(roomId, contractAddress);
        await redisService.addActiveGame(roomId);
        try {
            await prisma.room.upsert({
                where: { roomCode: roomId },
                update: { contractAddress },
                create: {
                    roomCode: roomId, contractAddress, status: 'WAITING',
                    creatorId: socket.user.userId,
                    maxPlayers: settings?.maxPlayers || 8,
                    smallBlind: settings?.smallBlind || 10,
                    bigBlind: settings?.bigBlind || 20,
                    turnTimer: settings?.turnTimer || 15,
                },
            });
        } catch (e) { console.error('Failed to persist room:', e); }
    }));

    // ─── joinRoom ───
    socket.on('joinRoom', validateEvent(dto.joinRoomSchema, async ({ roomId }) => {
        const walletAddress = socket.user.walletAddress;
        socket.join(roomId);
        userCurrentRoom.set(socket.user.userId, roomId);
        await redisService.setUserOnline(socket.user.userId, socket.id, roomId);

        if (!rooms.has(roomId)) {
            let settings = {};
            try {
                const dbRoom = await prisma.room.findUnique({ where: { roomCode: roomId } });
                if (dbRoom) settings = { maxPlayers: dbRoom.maxPlayers, smallBlind: dbRoom.smallBlind, bigBlind: dbRoom.bigBlind, turnTimer: dbRoom.turnTimer };
            } catch (e) {}

            const newRoom = new Room(roomId, settings);
            newRoom.onGameOver = async ({ winnerAddress, potAmount, netAmount, handName }) => {
                const contractAddress = roomContracts.get(roomId);
                if (!contractAddress) return;
                try {
                    const claimAmount = netAmount || potAmount;
                    const claimData = await generateClaimSignature(winnerAddress, claimAmount, contractAddress);
                    io.in(roomId).emit('gameOver', { winnerAddress: winnerAddress.toLowerCase(), potAmount, netAmount: claimAmount, claimData, handName });
                } catch (e) { console.error('Claim signature failed:', e); }
            };
            newRoom.onStateChange = () => broadcastGameState(roomId);
            rooms.set(roomId, newRoom);
        }

        const room = rooms.get(roomId);
        const existing = room.players.find(p => p && p.address === walletAddress);
        if (!existing) {
            room.addPlayer(socket.id, walletAddress);
            const p = room.players.find(p => p && p.address === walletAddress);
            if (p) p.chips = 0;
        } else {
            existing.socketId = socket.id;
        }

        // Contract resolution chain
        let currentContract = roomContracts.get(roomId)
            || await redisService.getRoomContract(roomId);
        if (!currentContract) {
            try {
                const dbRoom = await prisma.room.findUnique({ where: { roomCode: roomId } });
                if (dbRoom?.contractAddress) {
                    currentContract = dbRoom.contractAddress;
                    roomContracts.set(roomId, currentContract);
                    await redisService.cacheRoomContract(roomId, currentContract);
                }
            } catch (e) {}
        }
        if (currentContract) socket.emit('roomContractInfo', { contractAddress: currentContract });

        broadcastGameState(roomId);

        try {
            const dbRoom = await prisma.room.findUnique({ where: { roomCode: roomId } });
            if (dbRoom) await prisma.roomPlayer.upsert({ where: { userId_roomId: { userId: socket.user.userId, roomId: dbRoom.id } }, update: {}, create: { userId: socket.user.userId, roomId: dbRoom.id } });
        } catch (e) {}
    }));

    // ─── playerDeposited ───
    socket.on('playerDeposited', validateEvent(dto.playerDepositedSchema, async ({ roomId, amount, txHash }) => {
        const room = rooms.get(roomId);
        const contractAddress = roomContracts.get(roomId);
        if (!room || !contractAddress) return;
        const player = room.players.find(p => p && p.socketId === socket.id);
        if (!player) return;

        try {
            const alreadyProcessed = await redisService.isTxProcessed(txHash);
            if (alreadyProcessed) return socket.emit('errorMsg', 'Duplicate transaction');

            const existingTx = await prisma.transaction.findUnique({ where: { txHash } });
            if (existingTx) return socket.emit('errorMsg', 'Transaction already processed');

            const isValid = await verifyDepositTransaction(txHash, contractAddress, player.address, amount);
            if (!isValid) return socket.emit('errorMsg', 'Blockchain verification failed');

            const dbRoom = await prisma.room.findUnique({ where: { roomCode: roomId } });
            if (dbRoom) {
                await prisma.transaction.create({ data: { roomId: dbRoom.id, userId: socket.user.userId, type: 'DEPOSIT', amount, txHash, status: 'SUCCESS' } });
            }

            player.chips += parseInt(amount);
            const playersWithChips = room.players.filter(p => p && p.chips > 0);
            if (room.state === 'WAITING' && playersWithChips.length >= 2) {
                room.startGame();
                try { await prisma.room.update({ where: { roomCode: roomId }, data: { status: 'PLAYING' } }); } catch (e) {}
            }
            broadcastGameState(roomId);
        } catch (e) { console.error('Deposit error:', e); }
    }));

    // ─── playerAction ───
    socket.on('playerAction', validateEvent(dto.playerActionSchema, async ({ roomId, action, amount }) => {
        const room = rooms.get(roomId);
        if (room && room.handleAction(socket.id, action, amount)) broadcastGameState(roomId);
    }));

    // ─── sendVoice ───
    socket.on('sendVoice', validateEvent(dto.sendVoiceSchema, async ({ roomId, audioBuffer }) => {
        socket.to(roomId).emit('receiveVoice', { audioBuffer });
    }));

    // ─── disconnect ───
    socket.on('disconnect', async () => {
        await redisService.setUserOffline(socket.user.userId);
    });

    // ─── cashOut ───
    socket.on('cashOut', validateEvent(dto.cashOutSchema, async ({ roomId }) => {
        const room = rooms.get(roomId);
        const contractAddress = roomContracts.get(roomId);
        if (!room || !contractAddress) return;

        const player = room.leaveRoom(socket.id);
        if (!player) return;

        if (player.chips > 0) {
            try {
                const claimData = await generateClaimSignature(player.address, player.chips, contractAddress);
                socket.emit('cashOutSignature', claimData);
            } catch (e) { console.error('Cash out signature failed:', e); }
        }

        broadcastGameState(roomId);

        const remaining = room.players.filter(p => p !== null);
        if (remaining.length === 0) {
            await executeSweep(contractAddress);
            await redisService.deleteRoomContract(roomId);
            await redisService.removeActiveGame(roomId);
            await redisService.deleteGameState(roomId);
            try { await prisma.room.update({ where: { roomCode: roomId }, data: { status: 'FINISHED', finishedAt: new Date() } }); } catch (e) {}
        }
    }));
});

async function broadcastGameState(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    io.in(roomId).fetchSockets().then(async (sockets) => {
        sockets.forEach((socket) => socket.emit('gameStateUpdate', room.getGameStateFor(socket.id)));
        try { await redisService.cacheGameState(roomId, { playerCount: room.getActivePlayers().length, state: room.state, pot: room.pot }); } catch (e) {}
    });
}

server.listen(PORT, () => {
    console.log(`🚀 RiverPay Poker Backend running on port ${PORT}`);
});
