module.exports = class Party {
  constructor(chatters, amount) {
    this.chatters = chatters;
    this.amount = parseInt(amount);
  }
  getrandom(max) {
    let r = Math.floor(Math.random() * max);
    return r;
  }
  gathering(chatter) {
    if (this.chatters.length !== 0) {
      new Promise ((resolve, reject) => {
        this.chatters.forEach((c)=> {
          if (c == chatter.username) { reject();}
        });
        resolve();
      }).then(() => {
        this.chatters.push(chatter.username);
        this.log(chatter, true);
      }).catch(() => { this.log(chatter, false);})
    } else {
        this.chatters.push(chatter.username);
        this.log(chatter, true);
    }
  };
  log(chatter, success) {
    if (success) {
      process.stdout.write(`      └─── \x1b[32mnew\x1b[0m chatter added \x1b[1m${chatter.username}\x1b[0m`);
    } else {
      process.stdout.write(`      └─── \x1b[33mattended\x1b[0m to party \x1b[1m${chatter.username}\x1b[0m`);
    }
    if (chatter.mod) {
      process.stdout.write(` | \x1b[1m\x1b[34mMODERATOR\x1b[0m\n`);
    } else {
      process.stdout.write(`\n`);
    }
  }
  stack() {
    if (this.chatters.length >= this.amount) {
      let stacked = [];
      for ( let i = 0; stacked.length < this.amount; i++) {
        let randomchatter = this.getrandom(this.chatters.length);
        if (stacked.length !== 0) {
          stacked.forEach((c)=> {
            let attend = false;
            if (this.chatters[randomchatter] == `@${c}`) {
              attend = true
            }
            if (!attend) {
              stacked.push(`@${this.chatters[randomchatter]}`);
            }
          });
        } else {
          stacked.push(`@${this.chatters[randomchatter]}`);
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`> BOT | \x1b[1m[ PARTY ]\x1b[0m Gathering ${(stacked.length / this.amount)*100}%`);
      }
        process.stdout.write(`\n> BOT | \x1b[1m[ PARTY ]\x1b[0m Stacked [${stacked}]\n`);
      return stacked;
    } else  {
      process.stdout.write(`> BOT | \x1b[1m[ PARTY ]\x1b[0m \x1b[33mNot enough\x1b[0m gathered chatters for x${this.amount} stack\n`);
      process.stdout.write(`      └─── Now gathered ${this.chatters.length}, ${this.amount - this.chatters.length } more needed\n`);
    }
  }
}
