const crypto = require('crypto');

const suits = ['H', 'D', 'C', 'S'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
        this.shuffle();
    }

    reset() {
        this.cards = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(`${rank}${suit}`);
            }
        }
    }

    shuffle() {
        // Fisher-Yates with crypto.randomInt — cryptographically secure
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = crypto.randomInt(0, i + 1);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(count = 1) {
        if (this.cards.length < count) throw new Error('Deck is empty!');
        return this.cards.splice(0, count);
    }
}

module.exports = Deck;
