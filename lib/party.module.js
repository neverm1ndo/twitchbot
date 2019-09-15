module.exports = class Party {
  constructor() {
    this.chatters = [];
  }
  static gathering(chatter) {
    this.chatters.forEach((c)=> {
      if (c !== chatter) { this.chatters.push(chatter);}
    });
    console.log(`> BOT | [ PARTY ] : Chatters gathering ${this.chatters}`);
  }
  static stack() {

  }
}
