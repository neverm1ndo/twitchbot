const fs = require('fs');
const whitelist = JSON.parse(fs.readFileSync(__dirname + '/../etc/whitelist.json'));

module.exports = class Queue {
  constructor(options) {
    this.queue = [];
    this.options = {
      cooldown: options.cooldown
    }
  }

  get list() {
    return this.queue;
  }

  set innerCooldown(newcooldown) {
    this.cooldown = newcooldown;
  };

  clear() {
    this.queue = [];
  }

  check(message) {
    return new Promise((resolve, reject) => {
      if (!this.queue.includes(message.chatter)) {
        resolve(message);
      } else {
        reject(message);
      }
    });
  }

  toTimeout(chatter) {
    if (!whitelist.includes(chatter)) {
      this.queue.push(chatter);
      setTimeout(() => {
        this.removeFromQueue(chatter);
      }, this.options.cooldown*60000);
    };
  };

  removeFromQueue(chatter) {
    this.queue.forEach((user, index) => {
      if (user == chatter) {
        this.queue.splice(index, index + 1);
        console.log('Chatter ', chatter, ' removed from queue ', this.queue);
      };
    })
  };
}
