const Deck = require('./Deck');
const Hand = require('pokersolver').Hand;

class Room {
    constructor(roomId, settings = {}) {
        this.roomId = roomId;
        this.maxPlayers = settings.maxPlayers || 8;
        this.smallBlind = settings.smallBlind || 10;
        this.bigBlind = settings.bigBlind || 20;
        this.turnDuration = (settings.turnTimer || 15) * 1000;

        this.players = new Array(this.maxPlayers).fill(null);
        this.deck = new Deck();
        this.state = 'WAITING'; 
        this.pot = 0;
        this.communityCards = [];
        this.dealerIndex = 0;      
        this.currentPlayerTurn = -1; 
        this.currentHighestBet = 0; 
        this.minRaise = this.bigBlind; 
        this.playersActedThisRound = 0; 

        this.turnTimer = null;
        this.turnEndTime = 0; 
        this.onStateChange = null; 
        this.onGameOver = null; 
    }

    startTurnTimer() {
        if (this.turnTimer) clearTimeout(this.turnTimer);
        if (this.state === 'WAITING' || this.state === 'SHOWDOWN' || this.currentPlayerTurn === -1) {
            this.turnEndTime = 0; return;
        }

        const currentPlayer = this.players[this.currentPlayerTurn];
        if (!currentPlayer) return;

        this.turnEndTime = Date.now() + this.turnDuration;
        this.turnTimer = setTimeout(() => {
            const callAmount = this.currentHighestBet - currentPlayer.bet;
            const action = callAmount === 0 ? 'check' : 'fold';
            this.handleAction(currentPlayer.socketId, action);
            if (this.onStateChange) this.onStateChange();
        }, this.turnDuration);
    }

    addPlayer(socketId, walletAddress) {
        const emptySeatIndex = this.players.findIndex(p => p === null);
        if (emptySeatIndex === -1) return false;

        this.players[emptySeatIndex] = {
            socketId, address: walletAddress, chips: 1000, 
            bet: 0, totalInvested: 0, hand: [], // 🌟 升級：追蹤總投入成本
            isFolded: false, isAllIn: false, lastAction: null
        };
        return true;
    }

    leaveRoom(socketId) {
        const index = this.players.findIndex(p => p && p.socketId === socketId);
        if (index === -1) return null;
        const player = this.players[index];
        if (this.state !== 'WAITING' && !player.isFolded) {
            player.isFolded = true;
            this.checkRoundEnd();
        }
        this.players[index] = null;
        return player; 
    }

    removePlayer(socketId) {
        const index = this.players.findIndex(p => p && p.socketId === socketId);
        if (index !== -1) {
            if (this.state !== 'WAITING') {
                this.players[index].isFolded = true;
                this.checkRoundEnd(); 
            }
            this.players[index] = null;
        }
    }

    getActivePlayers() { return this.players.filter(p => p && !p.isFolded); }
    getActingPlayers() { return this.players.filter(p => p && !p.isFolded && !p.isAllIn); }

    startGame() {
        if (this.getActivePlayers().length < 2) return false;
        this.state = 'PRE_FLOP';
        this.deck.reset();
        this.deck.shuffle();
        this.pot = 0;
        this.communityCards = [];
        this.dealerIndex = this.getNextActiveIndex(this.dealerIndex);

        this.players.forEach(p => {
            if (p) {
                p.hand = this.deck.draw(2);
                p.isFolded = false; p.isAllIn = false;
                p.bet = 0; p.totalInvested = 0; p.lastAction = null;
            }
        });
        this.postBlinds();
        return true;
    }

    postBlinds() {
        const sbIndex = this.getNextActiveIndex(this.dealerIndex);
        const bbIndex = this.getNextActiveIndex(sbIndex);
        const sbPlayer = this.players[sbIndex];
        const bbPlayer = this.players[bbIndex];

        // 🔒 Cap blinds to actual chips (can't go negative)
        const sbAmount = Math.min(sbPlayer.chips, this.smallBlind);
        const bbAmount = Math.min(bbPlayer.chips, this.bigBlind);

        sbPlayer.chips -= sbAmount; 
        sbPlayer.bet = sbAmount; 
        sbPlayer.totalInvested += sbAmount;
        if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

        bbPlayer.chips -= bbAmount; 
        bbPlayer.bet = bbAmount; 
        bbPlayer.totalInvested += bbAmount;
        if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

        this.pot += sbAmount + bbAmount;
        // Current highest bet is the max of the two blinds (BB might be all-in for less)
        this.currentHighestBet = Math.max(sbAmount, bbAmount);
        this.minRaise = this.bigBlind;
        this.playersActedThisRound = 0; 
        
        this.currentPlayerTurn = this.getNextActiveIndex(bbIndex);
        this.startTurnTimer();
    }

    handleAction(socketId, action, amount = 0) {
        const pIndex = this.players.findIndex(p => p && p.socketId === socketId);
        if (pIndex === -1 || pIndex !== this.currentPlayerTurn) return false;

        const player = this.players[pIndex];
        if (!player || player.isFolded || player.isAllIn) return false;
        let isValidAction = false;
        const callAmount = this.currentHighestBet - player.bet;

        switch (action) {
            case 'fold':
                player.isFolded = true; player.lastAction = 'Fold'; isValidAction = true;
                break;
            case 'check':
                if (callAmount === 0) { player.lastAction = 'Check'; isValidAction = true; }
                break;
            case 'call':
                if (callAmount > 0) {
                    const actualCall = Math.min(callAmount, player.chips);
                    this.processBet(player, actualCall);
                    player.lastAction = player.isAllIn ? 'All-in' : 'Call';
                    isValidAction = true;
                }
                break;
            case 'raise':
                const targetBet = this.currentHighestBet + this.minRaise;
                const raiseRequired = targetBet - player.bet;
                let actualRaise = Math.max(amount, targetBet) - player.bet; 
                actualRaise = Math.min(actualRaise, player.chips); 

                if (actualRaise >= raiseRequired || actualRaise === player.chips) {
                    const oldHighest = this.currentHighestBet;
                    this.processBet(player, actualRaise);
                    if (player.bet > oldHighest) {
                        this.minRaise = player.bet - oldHighest;
                        this.currentHighestBet = player.bet;
                        this.playersActedThisRound = 0; 
                    }
                    player.lastAction = player.isAllIn ? 'All-in' : 'Raise';
                    isValidAction = true;
                }
                break;
        }

        if (isValidAction) {
            if (this.turnTimer) clearTimeout(this.turnTimer);
            this.turnEndTime = 0;
            this.playersActedThisRound++;
            this.checkRoundEnd();
            return true;
        }
        return false;
    }

    processBet(player, amount) {
        // 🔒 Safety: never allow betting more than player has
        const safeAmount = Math.min(amount, player.chips);
        if (safeAmount <= 0) return;
        player.chips -= safeAmount; 
        player.bet += safeAmount; 
        player.totalInvested += safeAmount;
        this.pot += safeAmount;
        if (player.chips === 0) player.isAllIn = true;
    }

    checkRoundEnd() {
        const active = this.getActivePlayers();
        const acting = this.getActingPlayers();

        if (active.length === 1) { this.endGame(active[0]); return; }

        let roundComplete = true;
        for (let p of acting) {
            if (p.bet < this.currentHighestBet || this.playersActedThisRound < acting.length) {
                roundComplete = false; break;
            }
        }

        if (roundComplete || acting.length <= 1) this.advancePhase();
        else {
            this.currentPlayerTurn = this.getNextActiveIndex(this.currentPlayerTurn);
            this.startTurnTimer(); 
        }
    }

    advancePhase() {
        this.players.forEach(p => { if (p) { p.bet = 0; p.lastAction = null; } });
        this.currentHighestBet = 0; this.minRaise = this.bigBlind; this.playersActedThisRound = 0;

        const acting = this.getActingPlayers();
        
        if (this.state === 'PRE_FLOP') { this.state = 'FLOP'; this.communityCards = this.deck.draw(3); } 
        else if (this.state === 'FLOP') { this.state = 'TURN'; this.communityCards.push(...this.deck.draw(1)); } 
        else if (this.state === 'TURN') { this.state = 'RIVER'; this.communityCards.push(...this.deck.draw(1)); } 
        else if (this.state === 'RIVER') { this.handleShowdown(); return; }

        if (acting.length <= 1 && this.state !== 'SHOWDOWN') {
            if (this.turnTimer) clearTimeout(this.turnTimer);
            this.turnEndTime = 0;
            setTimeout(() => this.advancePhase(), 1000); 
            this.currentPlayerTurn = -1;
            if (this.onStateChange) this.onStateChange();
        } else {
            this.currentPlayerTurn = this.getNextActiveIndex(this.dealerIndex);
            this.startTurnTimer(); 
        }
    }

    formatCardForSolver(cardStr) {
        let rank = cardStr.slice(0, -1); let suit = cardStr.slice(-1).toLowerCase();
        if (rank === '10') rank = 'T'; return `${rank}${suit}`;
    }

    // 🌟 終極完美版：邊池 (Side Pot) 結算演算法
    handleShowdown() {
        if (this.turnTimer) clearTimeout(this.turnTimer);
        this.turnEndTime = 0;

        const activePlayers = this.getActivePlayers();
        const communitySolverFormat = this.communityCards.map(c => this.formatCardForSolver(c));

        // 解析每個人牌型
        activePlayers.forEach(p => {
            const fullHand = [...p.hand.map(c => this.formatCardForSolver(c)), ...communitySolverFormat];
            p.solvedHand = Hand.solve(fullHand);
        });

        let remainingPlayers = this.players.filter(p => p && p.totalInvested > 0);
        let payouts = new Map(); // 紀錄每個贏家的總獎金與牌型

        // 🌟 遞迴拆解邊池，直到總投入歸零
        while (remainingPlayers.length > 0) {
            let minInvested = Math.min(...remainingPlayers.map(p => p.totalInvested));
            let subPot = 0;
            let contributors = [];

            this.players.forEach(p => {
                if (p && p.totalInvested > 0) {
                    let contribution = Math.min(p.totalInvested, minInvested);
                    p.totalInvested -= contribution;
                    subPot += contribution;
                    if (!p.isFolded) contributors.push(p);
                }
            });

            if (contributors.length > 0 && subPot > 0) {
                const solverHands = contributors.map(p => p.solvedHand);
                const winners = Hand.winners(solverHands);
                const splitAmount = subPot / winners.length;

                winners.forEach(w => {
                    const winnerPlayer = contributors.find(p => p.solvedHand === w);
                    const current = payouts.get(winnerPlayer.address) || { amount: 0, handName: w.name };
                    current.amount += splitAmount;
                    payouts.set(winnerPlayer.address, current);
                });
            }

            remainingPlayers = this.players.filter(p => p && p.totalInvested > 0);
        }

        // 發放籌碼並廣播 Web3 結算
        payouts.forEach((data, address) => {
            const player = this.players.find(p => p && p.address === address);
            if (!player) return;
            const commission = data.amount * 0.10; // 平台抽水 10%
            const netWin = data.amount - commission;
            player.chips += netWin;
            
            if (this.onGameOver) {
                // Send both gross (for display) and net (actual payout)
                this.onGameOver({ 
                    winnerAddress: player.address, 
                    potAmount: data.amount,
                    netAmount: netWin,
                    handName: data.handName 
                });
            }
        });

        this.state = 'SHOWDOWN'; 
        this.currentPlayerTurn = -1;
        if (this.onStateChange) this.onStateChange();

        setTimeout(() => { 
            if (this.getActivePlayers().length >= 2) this.startGame(); 
            else { this.state = 'WAITING'; if (this.onStateChange) this.onStateChange(); }
        }, 8000);
    }

    endGame(winner) {
        if (this.turnTimer) clearTimeout(this.turnTimer);
        this.turnEndTime = 0;

        const commission = this.pot * 0.10;
        const payout = this.pot - commission;
        winner.chips += payout;
        
        // 🌟 通知對手棄牌的勝利
        if (this.onGameOver) this.onGameOver({ 
            winnerAddress: winner.address, 
            potAmount: this.pot, 
            netAmount: payout,
            handName: '對手棄牌 (Opponent Folded)' 
        });
        
        this.state = 'WAITING'; this.currentPlayerTurn = -1;
        if (this.onStateChange) this.onStateChange();
        
        setTimeout(() => { if (this.getActivePlayers().length >= 2) this.startGame(); }, 5000);
    }

    getNextActiveIndex(currentIndex) {
        let nextIndex = (currentIndex + 1) % this.maxPlayers;
        while (!this.players[nextIndex] || this.players[nextIndex].isFolded || this.players[nextIndex].isAllIn) {
            nextIndex = (nextIndex + 1) % this.maxPlayers;
            if (nextIndex === currentIndex) break; 
        }
        return nextIndex;
    }

    getGameStateFor(socketId) {
        return {
            state: this.state, pot: this.pot, communityCards: this.communityCards,
            currentPlayerTurn: this.currentPlayerTurn, currentHighestBet: this.currentHighestBet,
            turnEndTime: this.turnEndTime, 
            players: this.players.map(p => {
                if (!p) return null;
                return {
                    address: p.address, chips: p.chips, bet: p.bet,
                    lastAction: p.lastAction, isFolded: p.isFolded, isAllIn: p.isAllIn,
                    hand: (this.state === 'SHOWDOWN' && !p.isFolded) 
                          ? p.hand : (p.socketId === socketId ? p.hand : (p.isFolded ? null : ['hidden', 'hidden']))
                };
            })
        };
    }

    // Serialize full state for crash recovery
    serialize() {
        return {
            state: this.state,
            pot: this.pot,
            communityCards: this.communityCards,
            dealerIndex: this.dealerIndex,
            currentPlayerTurn: this.currentPlayerTurn,
            currentHighestBet: this.currentHighestBet,
            minRaise: this.minRaise,
            playersActedThisRound: this.playersActedThisRound,
            turnEndTime: this.turnEndTime,
            players: this.players.map(p => p ? {
                address: p.address,
                chips: p.chips,
                bet: p.bet,
                totalInvested: p.totalInvested,
                hand: p.hand,
                isFolded: p.isFolded,
                isAllIn: p.isAllIn,
                lastAction: p.lastAction,
            } : null),
        };
    }

    restore(data, socketMap) {
        this.state = data.state;
        this.pot = data.pot;
        this.communityCards = data.communityCards;
        this.dealerIndex = data.dealerIndex;
        this.currentPlayerTurn = data.currentPlayerTurn;
        this.currentHighestBet = data.currentHighestBet;
        this.minRaise = data.minRaise;
        this.playersActedThisRound = data.playersActedThisRound;
        this.turnEndTime = 0; // Reset timer on restore
        this.players = data.players.map(p => {
            if (!p) return null;
            return {
                ...p,
                socketId: socketMap[p.address] || '',
            };
        });
        if (this.state !== 'WAITING' && this.currentPlayerTurn >= 0) {
            this.startTurnTimer();
        }
    }
}

module.exports = Room;