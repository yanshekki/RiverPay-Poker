const suits = ['H', 'D', 'C', 'S']; // 紅心, 方塊, 梅花, 黑桃
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
        // Fisher-Yates 洗牌演算法 (最公平的隨機洗牌)
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(count = 1) {
        if (this.cards.length < count) throw new Error("牌庫沒牌了！");
        return this.cards.splice(0, count);
    }
}

module.exports = Deck;