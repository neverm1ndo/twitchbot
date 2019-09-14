
module.exports = class Monitor {

  constructor() {}

  static monitor() {
    setInterval(()=> {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`> BOT | Module Player -- Status : ${_timeout ? 'PLAYING ▶' : 'STOPED'}`);
    }, 1000);
  }

};
