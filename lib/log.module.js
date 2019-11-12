'use strict'

const chalk = require('chalk');
const Timestamp = require('./timestamp.module.js');
const readline = require('readline');

module.exports = class Log {
  constructor() {
    this.rows = process.stdout.getWindowSize()[0];
    this.lines = process.stdout.getWindowSize()[1];
    this.width = Math.round(this.rows - this.rows/3);
    this.loglines = [];
    this.filled = 0;
  }

  get logcount() {
    return this.loglines.length;
  }

  canvas() {
    process.stdout.write('\n');
    for (let i = 0; i < this.lines - 2; i++) {
      process.stdout.cursorTo(10);
      process.stdout.write('│ ');
      process.stdout.cursorTo(this.width);
      process.stdout.write(' │ \n');
    }
  };
  render() {
    process.stdout.moveCursor(0, -(this.lines - 3));
    let list;
    if (this.filled > (this.lines - 4)) {
      list = this.loglines.slice((this.loglines.length - (this.lines - 4)), this.loglines.length - 1);
      for (let i = 0; i < list.length; i++) {
        this.print(list[i].message, list[i].nickname, list[i].time);
      }
    } else {
      list = this.loglines;
      for (let i = 0; i < this.loglines.length; i++) {
        this.print(list[i].message, list[i].nickname, list[i].time);
      }
    }
    process.stdout.cursorTo(0, this.lines);
  }
  print(message, nickname, timestamp) {
    if (nickname == undefined) {
      nickname = '';
    }
    let skips = this.width - 13 - nickname.length;
    process.stdout.write(` \x1b[2m${timestamp} \x1b[0m│`);
    process.stdout.write(` \x1b[1m${nickname}\x1b[0m${nickname!==''?':':''}`);
      if ((message.length + 13 + nickname.length) >= this.width ) {
        let splitedMessage = message.split(/\s/);
        for (let i = 0; i <= Math.round((message.length + 13 + nickname.length)/this.width); i++) {
          if (i > 0) {
            process.stdout.cursorTo(12 + nickname.length);
          }
          this.filled++;
          process.stdout.write(message.slice((skips)*i , (skips)*(i+1)) + '\n');
        }
      } else {
        process.stdout.write(message + '\n');
        this.filled++;
      }

  }
  log(message, nickname) {
    this.loglines.push({message : message, nickname: nickname, time: Timestamp.local(new Date())});
    this.render();
  }
}
