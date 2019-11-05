'use strict'

let player = require('play-sound')({});
let mp3d = require('mp3-duration');
const ytdl = require('ytdl-core');
const fs = require('fs');

let _timeout = false;
let _global = false;

let queue = [];
let timeouted = [];

function global() {
  _global = true;
  process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : global cooldown enabled\n`);
  setTimeout( t => {
    _global = false;
    process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : global cooldown disabled\n`);
  }, 80000);
}

function timeout(delay, path) {
  _timeout = true;
  queue.push(path);
  process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${path}\x1b[0m added to timeout queue\n      └───> QUEUE items [${queue.length}]: [${queue}]\n`);
  setTimeout( t => {
    _timeout = false;
    queue.forEach((p, index) => {
      if ( p == path ) {
        queue.splice(index, 1);
        process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${path}\x1b[0m removed from timeout queue\n      └───> QUEUE items [${queue.length}]: [${queue}]\n`);
      }
    });
  }, delay);
};

module.exports = class Player {
  constructor() {}
  static play(path, delay) {
    new Promise((resolve, reject) => {
      let timed = false;
      queue.forEach((sound)=> {
        if (sound == path) { timed = true }
      });
      if (!timed && !_global) { resolve(); global();}
      else { reject(path); }
    }).then(() => {
      timeout(delay, path);
      let audio = player.play(path, (err) => {
        if (err) console.log(err);
      });
      mp3d(path, function (err, duration) {
        if (err) return console.log(err.message);
        else setTimeout(t => { audio.kill() }, (duration*1000) + 2000);
      });
    }).catch((p) => { console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${p}\x1b[0m in queue`); })
  }
  static video(link, chatter) {
    new Promise((resolve, reject) => {
      if (!timeouted.includes(chatter)) { resolve(chatter) }
      else { reject(chatter) };
    }).then((chatter)=> {
      timeouted.push(chatter);
        setTimeout(() => {
          timeouted.pop(chatter);
            process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${chatter}\x1b[0m chatter removed from timeout queue\n      └───> QUEUE items [${timeouted.length}]: [${timeouted}]\n`);
        }, 5*60000);
      console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${link}\x1b[0m loading`);
      ytdl(link).pipe(
        fs.createWriteStream('./probs/clips/substream.flv')
        .on("finish", () => {
          console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${link}\x1b[0m successfully loaded`);
            player.play("./probs/clips/substream.flv", (err) => {
              if (err) console.log(err);
            });
          })
        );
    }).catch((chatter) => {
        process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[31m${chatter}\x1b[0m requests a clip, but he still in timeout queue\n      └───> QUEUE items [${timeouted.length}]: [${timeouted}]\n`);
    });
  };
}
