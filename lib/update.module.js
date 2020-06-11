const fs = require('fs');
const request = require('request');

module.exports = class Updater {
  constructor() {
    this.controlSumm = fs.readFileSync(`${__dirname}./csumm`);
  }

  checkUpdate() {
    this.request = request;
    request('http://localhost:3002', (error, response) => {
      if (response) {
        if (response.csumm !== this.controlSumm) {
          fs.writeFile(`${__dirname}../etc/sounds.library.json`, response.library, (err) => {
            if (err) throw err;
            console.log('Sounds library updated');
          });
        } else {
          console.log(`Bot is out of date ---------- \n Control summ: ${this.controlSumm}`);
        }
      }
    });
  }
};
