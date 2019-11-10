#!/usr/bin/env node
'use strict';

const Loader = require('./loader.module.js');

module.exports = class Logo {
  constructor(lines, rows) {
    this.lines = process.stdout.getWindowSize()[1];
    this.rows = process.stdout.getWindowSize()[0];
    this.loader = new Loader();
    this.parts = {
      0:"\x1b[1m",
      1:  "                _,)\n",
      2:  "        _..._.-;-' \n",
      3:  "     .-'     `(       ____  _    _ __  ____     _______   ____   _____ \n",
      4:  "    /      ;   \\     / __ \\| |  | |  \\/  \\ \\   / /  __ \\ / __ \\ / ____|\n",
      5:  "   ;.' ;`  ,;  ;    | |  | | |__| | \\  / |\\ \\_/ /| |  | | |  | | |  __ \n",
      6:  "  .'' ``. (  \\ ;    | |  | |  __  | |\\/| | \\   / | |  | | |  | | | |_ |\n",
      7:  " / f_ _L \\ ;  )\\    | |__| | |  | | |  | |  | |  | |__| | |__| | |__| |\n",
      8:  " \\/|` '|\\/;; <;/     \\____/|_|  |_|_|  |_|  |_|  |_____/ \\____/ \\_____|\n",
      9:  "((; \\_/  (()      \n",
      10:  '     "             \x1b[0m'
    }
  }
  createPadding() {
    return Math.round(this.rows/2) - 40;
  }
  draw() {
    for(var i = 0; i < this.lines; i++) {
        console.log('\r\n');
    }
    process.stdout.moveCursor(0, -(Math.round(this.lines/2)+8));
    process.stdout.clearScreenDown();
    process.title.replace('ohmydog.js');
    // console.log(this.lines, this.rows);
    for (let part in this.parts) {
      process.stdout.cursorTo(this.createPadding());
      process.stdout.write(this.parts[part]);
    }
    console.log('OhMyDog Twitch chat bot. 2019, MIT Copyright\n');
  }
  clear() {
    this.loader.stop();
    for(var i = 0; i < this.lines; i++) {
        console.log('\r\n');
    }
    process.stdout.moveCursor(0, -this.lines);
    process.stdout.clearScreenDown();
  }
};
