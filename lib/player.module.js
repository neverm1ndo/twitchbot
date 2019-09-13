'use strict'

let player = require('play-sound')({});
let mp3d = require('mp3-duration');

module.exports = class Player {
  constructor() {}
  static play(path) {
    let audio = player.play(path, (err) => {
      if (err) throw err
    });
    mp3d(path, function (err, duration) {
      if (err) return console.log(err.message);
      else setTimeout(t => { audio.kill() }, duration*1000);
    });
  }
}
