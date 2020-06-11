const RNG = require('./rng.module.js');

module.exports = class Party {
  constructor(chatters, amount) {
    this.chatters = chatters;
    this.amount = parseInt(amount, 10);
    this.stacked = [];
  }

  get players() {
    return this.stacked;
  }

  gathering(chatter) {
    if (this.chatters.length !== 0) {
      new Promise((resolve, reject) => {
        this.chatters.forEach((c) => {
          if (c === ` @${chatter.username}`) { reject(); }
        });
        resolve();
      }).then(() => {
        this.chatters.push(` @${chatter.username}`);
        this.log(chatter, true);
      }).catch(() => { this.log(chatter, false); });
    } else {
      this.chatters.push(` @${chatter.username}`);
      this.log(chatter, true);
    }
  }

  log(chatter, success) {
    this.chatter = chatter;
    if (success) {
      process.stdout.write(`      └─── \x1b[32mnew\x1b[0m chatter added \x1b[1m${this.chatter.username}\x1b[0m`);
    } else {
      process.stdout.write(`      └─── \x1b[33mattended\x1b[0m to party \x1b[1m${this.chatter.username}\x1b[0m`);
    }
    if (this.chatter.mod || this.chatter.subscriber) {
      process.stdout.write(` |${this.chatter.mod ? '\x1b[1m\x1b[34m MODERATOR\x1b[0m' : ''}${this.chatter.subscriber ? '\x1b[1m\x1b[33m SUBSCRIBER\x1b[0m' : ''}`);
    }
    process.stdout.write('\n');
  }

  stack() {
    if (this.chatters.length >= this.amount) {
      const stacked = [];
      for (let i = 0; stacked.length < this.amount; i += 1) {
        const randomchatter = RNG.randomize(0, this.chatters.length);
        if (stacked.length !== 0) {
          let attend = false;
          stacked.forEach((c) => {
            if (c === this.chatters[randomchatter]) {
              attend = true;
            }
          });
          if (!attend) {
            stacked.push(this.chatters[randomchatter]);
          }
        } else {
          stacked.push(this.chatters[randomchatter]);
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`> BOT | \x1b[1m[ PARTY ]\x1b[0m Gathering ${(stacked.length / this.amount) * 100}%`);
      }
      process.stdout.write(`\n> BOT | \x1b[1m[ PARTY ]\x1b[0m Stacked [${stacked} ]\n`);
      this.stacked = stacked;
      return `OhMyDog ${stacked} ${(stacked.length > 1) ? 'были избраны' : 'был избран'} для пати!`;
    }
    process.stdout.write(`> BOT | \x1b[1m[ PARTY ]\x1b[0m \x1b[33mNot enough\x1b[0m gathered chatters for x${this.amount} stack\n`);
    process.stdout.write(`      └─── Now gathered ${this.chatters.length}, ${this.amount - this.chatters.length} more needed\n`);
    return `Не хватило игроков для пати из ${this.amount + 1} человек.`;
  }
};
