'use strict'

const Timestamp = require('./timestamp.module.js');

module.exports = class Head {
  constructor(channel) {
    this.name = ' OhMyDog';
    this.ver = 'v0.9.0';
    this.rows = process.stdout.getWindowSize()[0];
    this.lines = process.stdout.getWindowSize()[1];
    this.channel = `Connected to: ${channel}`;
  };
  draw() {
    process.stdout.moveCursor(0, 0);
    let head = this.name +' '+ this.ver;
    let strsLength = this.name.length + this.ver.length + this.channel.length + 2;
    for (let i = 0; i < (this.rows - strsLength); i++) {
      head = head + ' ';
    }
      process.stdout.write(`\x1b[7m\x1b[1m${head}`);
      process.stdout.write(`${this.channel} \x1b[0m`);
      this.drawTime();
  }
  drawTime() {
    setInterval(() => {
      process.stdout.moveCursor(0, -this.lines);
      process.stdout.cursorTo(Math.round(this.rows/2 - 4));
      process.stdout.write(`\x1b[7m\x1b[1m${Timestamp.local(new Date())}\x1b[0m\n`);
      process.stdout.moveCursor(0, this.lines);
    }, 1000)
  }
};
