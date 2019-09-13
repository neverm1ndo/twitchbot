'use strict'
let player = require('play-sound')({})

module.exports = class Player {
  constructor() {}
  static play(path) {
    let audio = player.play(path, function(err){
      if (err) throw err
    });
    setTimeout(t => { audio.kill() }, 1000);
  }
}
