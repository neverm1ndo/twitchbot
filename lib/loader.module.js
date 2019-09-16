var readline = require('readline');

module.exports = class Loader {
  constructor() {
    function* probsgen() {
      while (true) {
        yield* ['•   ',' •  ','  • ','   •','  • ',' •  '];;
      }
    }
    this.gen = probsgen();
    this.int = setInterval(() => {
      let prob = this.gen.next();
      if (prob.done) this.gen.next(true);
      readline.clearLine();
      readline.cursorTo(0);
      process.stdout.write('  Joining channel ' + prob.value + '\r');
    }, 500);
  }
  stop() {
    clearInterval(this.int);
    readline.clearLine();
    console.log('');
  }
}
