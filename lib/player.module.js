'use strict'

let player = require('play-sound')({});
let mp3d = require('mp3-duration');

let _timeout = false;

function timeout() {
  _timeout = true;
  setTimeout( t => {
    _timeout = false;
  }, 6000);
};

function monitor() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`> BOT | Module Player -- Status : ${_timeout ? 'PLAYING' : 'STOPED'}`);
}

module.exports = class Player {
  constructor() {}
  static play(path) {
      if (!_timeout) {
        timeout();
        let audio = player.play(path, (err) => {
          if (err) throw err
        });
        mp3d(path, function (err, duration) {
          if (err) return console.log(err.message);
          else setTimeout(t => { audio.kill(); timeout();}, duration*1000);
        });
      }
    }
  }
