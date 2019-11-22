var readline = require('readline');

module.exports = class Loader {
  constructor() {
    function* probsgen() {
      while (true) {
        yield* ['•   ',' •  ','  • ','   •','  • ',' •  '];;
      }
    }
    this.rows = process.stdout.columns;
    this.gen = probsgen();
    this.int = setInterval(() => {
      let prob = this.gen.next();
      if (prob.done) this.gen.next(true);
      readline.clearLine();
      process.stdout.cursorTo(Math.round(this.rows/2)-6);
      process.stdout.write('Joining channel ' + prob.value + '\r');
    }, 150);
  }
  stop() {
    clearInterval(this.int);
    process.stdout.clearLine();
    console.log('');
  }
}
