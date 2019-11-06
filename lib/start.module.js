#!/usr/bin/env node
'use strict';
module.exports = function Start() {

  let lines = process.stdout.getWindowSize()[1];
  let rows = process.stdout.getWindowSize()[0];

    for(var i = 0; i < lines; i++) {
        console.log('\r\n');
    }
    process.stdout.moveCursor(0, -lines);
    process.stdout.cursorTo(0);
    process.stdout.clearScreenDown();
    process.title.replace('ohmydog.js')


    if (rows > 74) {
      console.log("\x1b[1m",
        "                _,)","\n",
        "        _..._.-;-' ","\n",
        "     .-'     `(    ","   ____  _    _ __  ____     _______   ____   _____ ","\n",
        "    /      ;   \\   ","  / __ \\| |  | |  \\/  \\ \\   / /  __ \\ / __ \\ / ____|","\n",
        "   ;.' ;`  ,;  ;   "," | |  | | |__| | \\  / |\\ \\_/ /| |  | | |  | | |  __ ","\n",
        "  .'' ``. (  \\ ;   "," | |  | |  __  | |\\/| | \\   / | |  | | |  | | | |_ |","\n",
        " / f_ _L \\ ;  )\\   "," | |__| | |  | | |  | |  | |  | |__| | |__| | |__| |","\n",
        " \\/|` '|\\/;; <;/   ","  \\____/|_|  |_|_|  |_|  |_|  |_____/ \\____/ \\_____|","\n",
        "((; \\_/  (()      ","\n",
        '     "             \x1b[0m'
      );
    } else {
      console.log(
        " _____ _____ _____ __ __ ____  _____ _____ \n",
        "|     |  |  |     |  |  |    \\|     |   __|\n",
        "|  |  |     | | | |_   _|  |  |  |  |  |  |\n",
        "|_____|__|__|_|_|_| |_| |____/|_____|_____|\n"
      )
    }
    console.log('OhMyDog Twitch chat bot. 2019, MIT Copyright\n');
  };
