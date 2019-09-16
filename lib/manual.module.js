const Table = require('./table.module.js');

module.exports = class Manual {
  constructor() {
    this.stdin = process.openStdin();
    this.helplist = {
      $say: 'Say something in chat | $say [message]'
    }
  }

  get std() {
    return this.stdin;
  }
  log(d) {
    console.log(`> BOT | \x1b[1m[ MANUAL ]\x1b[0m : ${d.toString().trim()}`);
  }
  error() {
    console.log(`> BOT | \x1b[1m[ MANUAL ]\x1b[0m | \x1b[31m\x1b[1mERROR\x1b[0m\n      └───> \x1b[31mNo such command\x1b[0m`);
  }
  help() {
    Table.build(this.helplist);
  }
}
