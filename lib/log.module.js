'use strict'

const chalk = require('chalk');
const Timestamp = require('./timestamp.module.js');
const readline = require('readline');
const fs = require('fs');
const rw = require("rw-stream");

module.exports = class Log {
  constructor() {
    this.std = process.stdout;
    this.rows = this.std.getWindowSize()[0];
    this.lines = this.std.getWindowSize()[1];
    this.width = Math.round(this.rows - this.rows/3);
    this.loglines = [];
    this.filled = 0;
    this.syslogs = 0;
    this.logPath = __dirname + `/../logs/log${Timestamp.format(new Date())}.dog`;
    if (!fs.existsSync(this.logPath)) { fs.appendFile(this.logPath,'', (err) => {
      if (err) throw err;
      // console.log('The file has been created & saved!');
    }) };
    this.writeStream = fs.createWriteStream(this.logPath);
    this.writeStream.on('finish', () => {
      this.writeStream.write('---END---');
    });
    // this.rl = readline.createInterface({
    //   input: fs.createReadStream(this.logPath),
    //   // crlfDelay: Infinity,
    //   output: this.std,
    //   terminal: true
    // });
    // this.rl.on('line', function (line) {
    //   this.std.moveCursor(0, -(this.lines - (this.filled + 3)));
    //   this.std.write(line);
    //   this.filled++;
    // });
  }

  readLogFile() {
    let stats = fs.fstatSync(file);
    if (stats.size < readbytes+1) {
        setTimeout(readLogFile, 1000);
    }
    else {
        fs.read(file, new Buffer(bite_size), 0, bite_size, readbytes, processor);
    }
  }

  get logcount() {
    return this.loglines.length;
  }
  get syswidth() {
    return this.width;
  }
  get sysheight() {
    return this.lines;
  }

  canvas() {
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(0, -this.lines);
    this.std.write('\n');
    for (let i = 0; i < this.lines - 2; i++) {
      this.std.cursorTo(10);
      this.std.write('│ ');
      this.std.cursorTo(this.width);
      this.std.write(' │ \n');
    }
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(this.width + Math.round(this.width/4) - 5, -this.lines + 3);
    this.std.write(`\x1b[1mStream info\x1b[0m ${this.width}`);
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(this.width + 3, -this.lines + 4);
    for (let i = 0; i < this.width - 1; i++) {
      this.std.cursorTo(this.width + 2 + i);
      this.std.write('_');
    }
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(this.width + 3, -14);
    for (let i = 0; i < this.width - 1; i++) {
      this.std.cursorTo(this.width + 2 + i);
      this.std.write('_');
    }
  };
  render() {
    this.std.moveCursor(0, -(this.lines - 3));
    let list;
    if (this.filled > (this.lines - 4)) {
      let list = this.loglines.slice(Math.max(this.loglines.length - (this.lines - 4), 1));
      for (let i = 0; i < list.length; i++) {
        this.print(list[i].chatter, list[i].time);
      }
    } else {
      list = this.loglines;
      for (let i = 0; i < this.loglines.length; i++) {
        this.print(list[i].chatter, list[i].time);
      }
    }
    this.std.moveCursor(0, this.lines);
    // this.readStream.on('data', () => {
    // var data = stream.read();
    //   this.std.write(data + '/n');
    // });
  }
  print(chatter, timestamp) {
    if (chatter.username == undefined) chatter.username = '';
    if (chatter.color == null) chatter.color = '#FFFFFF';
    let skips = this.width - 13 - chatter.username.length;
    this.std.write(` \x1b[2m${timestamp} \x1b[0m│`);
    this.std.write(chalk.hex(chatter.color).bold(` \x1b[1m${chatter.username}`)+ `\x1b[0m${chatter.username!==''?': ':''}`);
      if ((chatter.message.length + 13 + chatter.username.length) >= this.width ) {
        let splitedMessage = chatter.message.split(/\s/);
        for (let i = 0; i <= Math.round((chatter.message.length + 13 + chatter.username.length)/this.width); i++) {
          if (i > 0) {
            this.std.cursorTo(0);
            this.std.cursorTo(12 + chatter.username.length);
          }

          // this.writeStream.write(message.slice((skips)*i , (skips)*(i+1)) + '\n');
          this.std.write(chatter.message.slice((skips)*i , (skips)*(i+1)) + '\n');
        }
      } else {
        this.std.write(chatter.message + '\n');
      }
  }
  chatlog(chatter) {
    this.filled = this.filled+1;
    // this.print(message, nickname, Timestamp.local(new Date()));
    this.loglines.push({chatter: chatter, time: Timestamp.local(new Date())});
    // this.writeStream.write();
    this.render();
    // this.std.moveCursor(0, -this.lines + 2 + this.filled);
    // this.std.write(` \x1b[2m${Timestamp.local(new Date())} \x1b[0m│`);
    // this.std.cursorTo(12);
    // this.std.write(chalk.hex(chatter.color).bold(` \x1b[1m${chatter.username}`)+ `\x1b[0m${chatter.username!==''?': ':''}` + `${chatter.message}`);
  }
  syslog(mod, message) {
    this.std.moveCursor(0, this.lines);
    this.syslogs = this.syslogs+1;
    // this.std.moveCursor(this.width + 1, -this.lines + 2 + this.filled);
    // this.std.write(` \x1b[2m${Timestamp.local(new Date())} \x1b[0m│`);
    this.std.moveCursor(this.width + 2, -this.lines + 5 + this.syslogs);
    this.std.cursorTo(this.width + 2);
    if (message.length > this.width - 10) message = message.slice(0, this.width - 10) + '...';
    this.std.write(chalk.hex(`#FF00FF`).bold(` \x1b[1m$${mod} `) + `${message}\n`);
  }
  playlog(message) {
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(this.width + 2, -10);
    // this.std.cursorTo(this.width + 2);
    if (message.length > this.width - 10) message = message.slice(0, this.width - 10) + '...';
    this.std.write(chalk.hex(`#FF00FF`).bold(` \x1b[1m$PLAYER `) + `${message}`);
  }
  tablelog(table) {
    this.std.moveCursor(12, -(this.lines - 3));

  }
}
