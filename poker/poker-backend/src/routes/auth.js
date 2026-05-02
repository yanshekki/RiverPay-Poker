const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const redisService = require('../services/redis');
const { validate } = require('../middleware/validate');
const { requestNonceSchema, verifySignatureSchema } = require('../dto');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// =============================================
// 1. Request login nonce
// =============================================
router.post('/request-nonce', validate(requestNonceSchema), async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();

        const clientIp = req.ip || req.connection.remoteAddress;
        const allowed = await redisService.checkRateLimit(`auth:nonce:${clientIp}`, 10, 60);
        if (!allowed) return res.status(429).json({ error: 'Too many requests, please try later' });

        const nonce = `Welcome to RiverPay Poker!\n\nSign this message to verify your identity.\nThis costs no gas.\n\nSecurity code: ${Math.floor(Math.random() * 1000000)}`;

        await prisma.user.upsert({
            where: { walletAddress: normalizedAddress },
            update: { nonce },
            create: { walletAddress: normalizedAddress, nonce },
        });

        res.json({ nonce });
    } catch (error) {
        console.error('Request Nonce Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =============================================
// 2. Verify signature and issue JWT
// =============================================
router.post('/verify-signature', validate(verifySignatureSchema), async (req, res) => {
    try {
        const { walletAddress, signature } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();

        const user = await prisma.user.findUnique({ where: { walletAddress: normalizedAddress } });
        if (!user) return res.status(400).json({ error: 'User not found. Request nonce first.' });

        const recoveredAddress = ethers.verifyMessage(user.nonce, signature);
        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const token = jwt.sign(
            { userId: user.id, walletAddress: normalizedAddress },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
        );

        // Rotate nonce to prevent replay attacks
        await prisma.user.update({
            where: { id: user.id },
            data: { nonce: Math.random().toString() },
        });

        res.json({ token, user: { id: user.id, walletAddress: normalizedAddress } });
    } catch (error) {
        console.error('Verify Signature Error:', error);
        res.status(500).json({ error: 'Signature verification failed' });
    }
});

module.exports = router;
