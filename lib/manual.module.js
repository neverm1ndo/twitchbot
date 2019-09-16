module.exports = class Manual {
  constructor() {
    this.stdin = process.openStdin();
  }
  start() {
    this.stdin.addListener("data", (d) => {
      console.log(d.toString().trim());
    })
  }
}
