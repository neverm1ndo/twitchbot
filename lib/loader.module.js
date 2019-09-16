module.exports = class Loader {
  constructor() {
    function* probsgen() {
      while (true) {
        yield* ['•',' •','  •','   •','  •',' •'];;
      }
    }
    this.gen = probsgen();
    this.int = setInterval(() => {
      let prob = this.gen.next();
      if (prob.done) this.gen.next(true);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdin.write(`  Joinind to channel ${prob.value}\r`);
    }, 500);
  }
  stop() {
    clearInterval(this.int);
    process.stdout.clearLine();
    process.stdin.write(`\n`);
  }
}
