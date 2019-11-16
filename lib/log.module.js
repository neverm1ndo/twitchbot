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

  canvas() {
    this.std.write('\n');
    for (let i = 0; i < this.lines - 2; i++) {
      this.std.cursorTo(10);
      this.std.write('│ ');
      this.std.cursorTo(this.width);
      this.std.write(' │ \n');
    }
    this.std.moveCursor(0, this.lines);
    this.std.moveCursor(this.width + 3, -this.lines + 3);
    this.std.write('Stream info:');
  };
  render() {
    this.std.moveCursor(0, -(this.lines - 3));
    let list;
    if (this.filled > (this.lines - 4)) {
      let list = this.loglines.slice(Math.max(this.loglines.length - (this.lines - 4), 1));
      for (let i = 0; i < list.length; i++) {
        this.print(list[i].message, list[i].nickname, list[i].time);
      }
    } else {
      list = this.loglines;
      for (let i = 0; i < this.loglines.length; i++) {
        this.print(list[i].message, list[i].nickname, list[i].time);
      }
    }
    this.std.moveCursor(0, this.lines);
    // this.readStream.on('data', () => {
    // var data = stream.read();
    //   this.std.write(data + '/n');
    // });
  }
  print(message, nickname, timestamp) {
    if (nickname == undefined) {
      nickname = '';
    }
    let skips = this.width - 13 - nickname.length;
    this.std.write(` \x1b[2m${timestamp} \x1b[0m│`);
    this.std.write(` \x1b[1m${nickname}\x1b[0m${nickname!==''?':':''}`);
      if ((message.length + 13 + nickname.length) >= this.width ) {
        let splitedMessage = message.split(/\s/);
        for (let i = 0; i <= Math.round((message.length + 13 + nickname.length)/this.width); i++) {
          if (i > 0) {
            this.std.cursorTo(0);
            // this.std.write(`${this.filled} | ${this.loglines.length - this.lines} | ${this.lines}`);
            this.std.cursorTo(12 + nickname.length);
          }

          this.writeStream.write(message.slice((skips)*i , (skips)*(i+1)) + '\n');
          this.std.write(message.slice((skips)*i , (skips)*(i+1)) + '\n');
        }
      } else {
        this.std.write(message + '\n');
        this.writeStream.write(`${timestamp} | ${nickname}${nickname!==''?':':''} ${message}` + '\r\n', 'utf8');
      }
  }
  log(message, nickname) {
    this.filled = this.filled+1;
    // this.print(message, nickname, Timestamp.local(new Date()));
    this.loglines.push({message : message, nickname: nickname, time: Timestamp.local(new Date())});
    // this.writeStream.write();
    this.render();
  }

  streamInfo() {
    this.std.moveCursor(this.width + 3, -this.lines + 3);
    this.std.write('Stream info:');
  }
}
