'use strict'

let player = require('play-sound')({});
let mp3d = require('mp3-duration');
const ytdl = require('ytdl-core');
const fs = require('fs');
const Table = require('./table.module.js');
let ffmpeg = require('fluent-ffmpeg');
let config = require('../configs/bot.config.js').player;




module.exports = class Player {
  constructor(logger) {
    this.logger = logger;
    this._timeout = false;
    this._global = false;

    this.queue = [];
    this.timeouted = [];
    this.playing = false;

    this.mod = 'PLAYER';
    this.w = this.logger.syswidth;
    this.h = this.logger.sysheight;
  }

  global() {
    this._global = true;
    this.logger.playlog(`\x1b[${this.h - 8};${this.w + 3}H Global cooldown enabled\n`);
    setTimeout( t => {
      this._global = false;
      this.logger.playlog(`\x1b[${this.h - 8};${this.w + 3}H Global cooldown disabled\n`);
    }, 80*1000);
  }

  timeout(delay, path) {
    this._timeout = true;
    this.queue.push(path);
    this.logger.playlog(`\x1b[0K\x1b[35m${path}\x1b[0m added to timeout queue\n\x1b[${this.w + 3}C\x1b[0K└───> QUEUE audios [${this.queue.length}]: [${this.queue}]`);
    setTimeout( t => {
      this._timeout = false;
      this.queue.forEach((p, index) => {
        if ( p == path ) {
          this.queue.splice(index, 1);
          this.logger.playlog(`\x1b[35m\x1b[0K${path}\x1b[0m removed from timeout queue\n\x1b[${this.w + 3}C\x1b[0K└───> QUEUE audios [${this.queue.length}]: [${this.queue}]`);
        }
      });
    }, delay);
  };

  play(path, delay) {
    new Promise((resolve, reject) => {
      let timed = false;
      this.queue.forEach((sound)=> {
        if (sound == path) { timed = true }
      });
      if (!timed && !this._global) { resolve(); this.global();}
      else { reject(path); }
    }).then(() => {
      this.timeout(delay, path);
      let audio = player.play(path,  { mplayer: ['-af', `volume=${config.volume.audio}.1:0`]}, (err) => {
        if (err) this.logger.playerror(`${err.message}`);
      });
      mp3d(path, (err, duration) => {
        if (err) return this.logger.playerror(`${err.message}`);
        else setTimeout(t => { audio.kill() }, (duration*1000) + 2000);
      });
    }).catch((p) => { this.logger.playlog(`\x1b[35m\x1b[0K${p}\x1b[0m in queue\n`); })
  };

  video(link, chatter) {
    new Promise((resolve, reject) => {
      if (!this.timeouted.includes(chatter) && !this.playing) { resolve(chatter) }
      else { reject(chatter) };
    }).then((chatter)=> {
      this.timeouted.push(chatter);
      // process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${chatter}\x1b[0m request accepted, added to the queue\n      └───> QUEUE chatters [${this.timeouted.length}]: [${this.timeouted}]\n`);
        setTimeout(() => {
          this.timeouted.pop(chatter);
            // process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${chatter}\x1b[0m chatter removed from timeout queue\n      └───> QUEUE chatters [${this.timeouted.length}]: [${this.timeouted}]\n`);
        }, 5*60000);
      // console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${link}\x1b[0m loading`);
      ytdl(link).pipe(
        fs.createWriteStream('./probs/clips/substream.mp4')
        .on("finish", () => {
          // process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${link}\x1b[0m successfully loaded > `);
            ffmpeg.ffprobe('./probs/clips/substream.mp4', (err, metadata) => {
              // process.stdout.write('Playing\n      | Video metadata\n');
              // Table.build(metadata.format);
              this.playing = true;
                player.play("./probs/clips/substream.mp4", { mplayer: ['-af', `volume=${config.volume.video}`, "-xy", "600", "-zoom", "-volume", "100"]}, (err) => {
                  // if (err) console.log(err);
                });
                setTimeout(()=> {
                  this.playing = false;
                  // console.log(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[35m${link}\x1b[0m stopped by itself`);
                }, metadata.format.duration*1000);
            });
          })
        );
    }).catch((chatter) => {
        // process.stdout.write(`> BOT | \x1b[1m[ PLAYER ]\x1b[0m : \x1b[31m${chatter}\x1b[0m requests a clip, but he still in timeout queue\n      └───> QUEUE chatters [${this.timeouted.length}]: [${this.timeouted}]\n`);
    });
  };
  reconfig() {
    console.log('\n      Reconfigurate player volume: ');
    Table.build(config.volume, true);
  }
}
