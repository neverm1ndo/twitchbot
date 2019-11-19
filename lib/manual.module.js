const Table = require('./table.module.js');
const Timestamp = require('./timestamp.module.js');
const Log = require('./log.module.js');

module.exports = class Manual {
  constructor(logger) {
    this.logger = logger;
    this.stdin = process.openStdin();
    this.helplist = {
      $say: ': say something in chat | $say [message]',
      $status: ': show status',
	    $refresh: ': refresh stream info',
      $fd: ': dumps list of followers',
      $fc: ': compares old and new dumps, shows stats | $fc 2019-11-11 today'
    }
  }

  get std() {
    return this.stdin;
  }
  log(d) {
    this.logger.log(`> BOT | \x1b[1m[ MANUAL ]\x1b[0m\x1b[0m\x1b[2m ${Timestamp.stamp()} \x1b[0m: ${d.toString().trim()}`);
  }
  error() {
    console.log(`> BOT | \x1b[1m[ MANUAL ]\x1b[0m\x1b[0m\x1b[2m ${Timestamp.stamp()} \x1b[0m| \x1b[31m\x1b[1mERROR\x1b[0m\n      └───> \x1b[31mNo such command\x1b[0m`);
  }
  help() {

    this.logger.log('        All manual console commands:');
    // Table.build(this.helplist, true);
  }
}
