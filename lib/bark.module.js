module.exports = class Bark {

  constructor(config, messages, bot) {
    this.config = config;
    this.messages = messages;
    this.bot = bot;

  }

  links() {
    this.bot.say(`DOTABUFF: ${config.links.dotabuff} ||| VK: ${config.links.vk} ||| Узнать цены на буст: ${config.links.site}`);
  }

  start() {
    setInterval(()=> {
      this.links();
      this.messages.forEach((mgs, index) => {
        $timeout(msg, index + 1);
      });
    }, this.config.interval);
  }

  timeout(message, index) {
    setTimeout(()=> {
      this.bot.say(message);
    }, conf.delay*index);
  }
}
