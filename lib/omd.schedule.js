const fs = require('fs');

module.exports = class Schedule {
  constructor() {
    this.schedules = {
      dictionary: JSON.parse(fs.readFileSync(`${__dirname}/../etc/banned.words.dict.json`)),
      sounds: JSON.parse(fs.readFileSync(`${__dirname}/../etc/sounds.library.json`)),
      automessages: JSON.parse(fs.readFileSync(`${__dirname}/../etc/automessages.list.json`)).m,
    };
  }

  get sounds() {
    return this.schedules.sounds;
  }

  get dictionary() {
    return this.schedules.dictionary;
  }

  set dictionary(newdict) {
    this.schedules.dictionary = newdict;
  }

  get automessages() {
    return this.schedules.automessages;
  }
};
