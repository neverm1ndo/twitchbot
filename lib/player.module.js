/**
 ** This is deprecated Module
 ** New player rebuilt for cloud hosting
* */
const player = require('play-sound')({});
const mp3d = require('mp3-duration');
const config = require('../configs/bot.config.js').player;

const globals = {
  timeout: false,
  global: false,
};

const queue = [];

function global() {
  globals.global = true;
  process.stdout.write('> BOT | \x1b[1m[ PLAYER ]\x1b[0m : global cooldown enabled\n');
  setTimeout(() => {
    globals.global = false;
    process.stdout.write('> BOT | \x1b[1m[ PLAYER ]\x1b[0m : global cooldown disabled\n');
  }, 80000);
}

function timeout(delay, path) {
  globals.timeout = true;
  queue.push(path);
  process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${path}\x1b[0m added to timeout queue\n      └───> QUEUE audios [${queue.length}]: [${queue}]\n`);
  setTimeout(() => {
    globals.timeout = false;
    queue.forEach((p, index) => {
      if (p === path) {
        queue.splice(index, 1);
        process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${path}\x1b[0m removed from timeout queue\n      └───> QUEUE audios [${queue.length}]: [${queue}]\n`);
      }
    });
  }, delay);
}

module.exports = class Player {
  static play(path, delay) {
    new Promise((resolve, reject) => {
      let timed = false;
      queue.forEach((sound) => {
        if (sound === path) { timed = true; }
      });
      if (!timed && !globals.global) { resolve(); global(); } else { reject(path); }
    }).then(() => {
      timeout(delay, path);
      const audio = player.play(path, { mplayer: ['-af', `volume=${config.volume.audio}.1:0`] }, (err) => {
        if (err) console.log(err);
      });
      mp3d(path, (err, duration) => {
        if (err) {
          console.log(err.message);
        } else {
          setTimeout(() => { audio.kill(); }, (duration * 1000) + 2000);
        }
      });
    }).catch((p) => { console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${p}\x1b[0m in queue`); });
  }
};
