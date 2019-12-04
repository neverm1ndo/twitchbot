const fs = require('fs');
const whitelist = JSON.parse(fs.readFileSync(__dirname + '/../etc/whitelist.json'));
const Timestamp = require('./timestamp.module.js');

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

  addTime(user, time) {
    this.queue.forEach((u, index) => {
      if (u.username == user) {
        this.queue[index] = {username: u, start: (Date.now() - (time*60000))};
        console.log('> ', u, ' added to queue for ', time, ' minutes');
      }
    });
  }

  countTime(user) {
    return new Promise ((resolve, reject) => {
      let now = Date.now();
      this.queue.forEach((userInQ, index) => {
        if (userInQ.username == user) {
          resolve(Timestamp.parseCD(this.options.cooldown*60000 - ( now - userInQ.start)));
        }
      });
      reject(user);
    });
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
      let now = Date.now();
      this.queue.push({username: chatter, start: now});
      setTimeout(() => {
        this.removeFromQueue(chatter);
      }, this.options.cooldown*60000);
    };
  };

  removeFromQueue(chatter) {
    this.queue.forEach((user, index) => {
      if (user.username == chatter) {
        this.queue.splice(index, index + 1);
        console.log('Chatter ', chatter, ' removed from queue ', this.queue);
      };
    })
  };
}
