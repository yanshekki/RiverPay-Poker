const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('📦 Redis 連線成功'));
redis.on('error', (err) => console.error('❌ Redis 錯誤:', err.message));

// ==========================================
// 1. User Session (online status, current room)
// ==========================================
const USER_SESSION_TTL = 3600; // 1 hour

async function setUserOnline(userId, socketId, roomId) {
  const key = `user:session:${userId}`;
  await redis.hset(key, {
    socketId,
    roomId: roomId || '',
    online: 'true',
    lastSeen: Date.now().toString(),
  });
  await redis.expire(key, USER_SESSION_TTL);
}

async function getUserSession(userId) {
  return redis.hgetall(`user:session:${userId}`);
}

async function setUserOffline(userId) {
  const key = `user:session:${userId}`;
  await redis.hset(key, 'online', 'false', 'lastSeen', Date.now().toString());
}

async function getUserRoom(userId) {
  return redis.hget(`user:session:${userId}`, 'roomId');
}

// ==========================================
// 2. Room Contract Cache
// ==========================================
async function cacheRoomContract(roomId, contractAddress) {
  await redis.set(`room:contract:${roomId}`, contractAddress, 'EX', 86400); // 24h
}

async function getRoomContract(roomId) {
  return redis.get(`room:contract:${roomId}`);
}

async function deleteRoomContract(roomId) {
  await redis.del(`room:contract:${roomId}`);
}

// ==========================================
// 3. Rate Limiting (Auth)
// ==========================================
async function checkRateLimit(key, maxRequests = 20, windowSec = 60) {
  const rlKey = `ratelimit:${key}`;
  const current = await redis.incr(rlKey);
  if (current === 1) await redis.expire(rlKey, windowSec);
  return current <= maxRequests;
}

// ==========================================
// 4. Transaction Nonce Cache (prevent replay)
// ==========================================
async function isTxProcessed(txHash) {
  const key = `tx:${txHash}`;
  // 🔒 Atomic: SET NX returns OK only if key didn't exist
  const result = await redis.set(key, '1', 'EX', 3600, 'NX');
  return result !== 'OK'; // true = already processed (key existed)
}

// ==========================================
// 5. Game State Cache (survive restart)
// ==========================================
async function cacheGameState(roomId, state) {
  await redis.set(`game:${roomId}`, JSON.stringify(state), 'EX', 3600);
}

async function getGameState(roomId) {
  const data = await redis.get(`game:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteGameState(roomId) {
  await redis.del(`game:${roomId}`);
}

// Chip balance persistence
async function cacheChipBalances(roomId, chipData) {
  await redis.set(`chips:${roomId}`, JSON.stringify(chipData), 'EX', 86400);
}

async function getChipBalances(roomId) {
  const data = await redis.get(`chips:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteChipBalances(roomId) {
  await redis.del(`chips:${roomId}`);
}

// Full game state persistence (survive server crash)
async function cacheFullGameState(roomId, fullState) {
  await redis.set(`fullgame:${roomId}`, JSON.stringify(fullState), 'EX', 3600);
}

async function getFullGameState(roomId) {
  const data = await redis.get(`fullgame:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteFullGameState(roomId) {
  await redis.del(`fullgame:${roomId}`);
}

// ==========================================
// 6. Active Games Tracking
// ==========================================
async function addActiveGame(roomId) {
  await redis.sadd('active:games', roomId);
}

async function removeActiveGame(roomId) {
  await redis.srem('active:games', roomId);
}

async function getActiveGames() {
  return redis.smembers('active:games');
}

module.exports = {
  redis,
  setUserOnline,
  getUserSession,
  setUserOffline,
  getUserRoom,
  cacheRoomContract,
  getRoomContract,
  deleteRoomContract,
  checkRateLimit,
  isTxProcessed,
  cacheGameState,
  getGameState,
  deleteGameState,
  addActiveGame,
  removeActiveGame,
  getActiveGames,
  cacheChipBalances,
  getChipBalances,
  deleteChipBalances,
  cacheFullGameState,
  getFullGameState,
  deleteFullGameState,
};
