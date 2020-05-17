module.exports = class Bark {

  constructor(config, messages, bot) {
    this.config = config;
    this.messages = messages;
    this.bot = bot;

  }

  links() {
    this.bot.say(`DOTABUFF: ${this.config.links.dotabuff} ||| VK: ${this.config.links.vk}`);
  }

  donate() {
    this.bot.say(`Поддержать стримлера можно через DonationAlerts: ${this.config.links.donationalerts} . Прикреплнное сообщение обязательно будет озвучено! OhMyDog`)
  }

  timeout(message, index) {
    setTimeout(()=> {
      this.bot.say(message);
    }, this.config.delay*index);
  }

  start() {
    setInterval(()=> {
      this.links();
      this.messages.forEach((msg, index) => {
        this.timeout(msg, index + 1);
      });
    }, this.config.interval);
  }
}
