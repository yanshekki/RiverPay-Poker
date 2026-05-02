const { z } = require('zod');

// =============================================
// Auth DTOs
// =============================================
const requestNonceSchema = z.object({
  walletAddress: z.string()
    .min(42, 'Invalid wallet address length')
    .max(42, 'Invalid wallet address length')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

const verifySignatureSchema = z.object({
  walletAddress: z.string()
    .min(42)
    .max(42)
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  signature: z.string()
    .min(10, 'Signature too short')
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
});

// =============================================
// Game DTOs
// =============================================
const joinRoomSchema = z.object({
  roomId: z.string()
    .min(2, 'Room ID too short')
    .max(20, 'Room ID too long')
    .regex(/^[A-Z0-9]+$/, 'Room ID must be alphanumeric uppercase'),
});

const roomCreatedSchema = z.object({
  roomId: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
  contractAddress: z.string()
    .min(42).max(42)
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  settings: z.object({
    maxPlayers: z.number().int().min(2).max(8).optional(),
    smallBlind: z.number().int().min(1).optional(),
    bigBlind: z.number().int().min(1).optional(),
    turnTimer: z.number().int().min(5).max(120).optional(),
  }).optional().default({}),
});

const playerDepositedSchema = z.object({
  roomId: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
  amount: z.number().positive('Amount must be positive'),
  txHash: z.string()
    .min(10, 'Transaction hash too short')
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
});

const playerActionSchema = z.object({
  roomId: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
  action: z.enum(['fold', 'check', 'call', 'raise']),
  amount: z.number().min(0).optional().default(0),
});

const cashOutSchema = z.object({
  roomId: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
});

const sendVoiceSchema = z.object({
  roomId: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
  audioBuffer: z.any(),
});

module.exports = {
  requestNonceSchema,
  verifySignatureSchema,
  joinRoomSchema,
  roomCreatedSchema,
  playerDepositedSchema,
  playerActionSchema,
  cashOutSchema,
  sendVoiceSchema,
};
