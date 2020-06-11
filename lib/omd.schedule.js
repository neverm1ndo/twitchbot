const fs = require('fs');

module.exports = class Schedule {
  constructor() {
    this.schedules = {
      dictionary: JSON.parse(fs.readFileSync(`${__dirname}/../etc/banned.words.dict.json`)),
      sounds: JSON.parse(fs.readFileSync(`${__dirname}/../etc/sounds.library.json`)),
      automessages: JSON.parse(fs.readFileSync(`${__dirname}/../etc/automessages.list.json`)).m,
    };
  }
};
