/* eslint max-classes-per-file: ["error", 10] */

let ws;

class Alert {
  constructor() {
    this.box = document.querySelector('.alert');
  }

  success(message) {
    this.box.innerHTML = message;
    this.box.style.background = '#43A047';
    this.box.style.display = 'block';
    setTimeout(() => {
      this.closeAlert();
    }, 2000);
  }

  error(message) {
    this.box.innerHTML = `<span>Произошла ошибка: ${message}</span>`;
    this.box.style.background = '#B71C1C';
    this.box.style.display = 'block';
    setTimeout(() => {
      this.closeAlert();
    }, 2000);
  }

  warn(message) {
    this.box.innerHTML = `<span>Обрыв соединения: ${message}</span>`;
    this.box.style.background = '#F57F17';
    this.box.style.display = 'block';
  }

  closeAlert() {
    this.box.style.display = 'none';
  }
}
class BotStatus {
  constructor() {
    this.state = '';
    this.led = document.querySelector('.led');
  }

  set setStatus(newstate) {
    this.state = newstate;
    if (this.state === 'works') {
      this.led.style.background = '#43A047';
      this.led.title = 'Бот подключен к чату';
    } else {
      this.led.style.background = '#F57F17';
      this.led.title = 'Бот отключен от чата';
    }
  }
}

const alert = new Alert();
const botStatus = new BotStatus();

(function setConnection() {
  ws = new WebSocket(`ws://${window.location.host.split(':')[0]}`);
  ws.onopen = () => {
    alert.closeAlert();
    alert.success('Соединение установлено');
    ws.send(JSON.stringify({ event: 'dashboard-connection' }));
  };

  ws.onclose = (event) => {
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
      alert.warn(`Код: ${event.code}`);
      setTimeout(() => {
        setConnection();
      }, 5000);
    }
    console.log(`Code: ${event.code}\n Reason: ${event.reason}`);
  };

  ws.onmessage = (event) => {
    const depeche = JSON.parse(event.data);
    console.log(depeche);
    switch (depeche.event) {
      case 'save-success':
        alert.success('Настройки успешно применены');
        break;
      case 'save-fail':
        alert.error(`Ошибка: ${depeche.message}`);
        break;
      case 'bot-status':
        botStatus.setStatus = depeche.message;
        break;
      default:
    }
  };

  ws.onerror = (error) => {
    alert.error(error);
    console.log(`Ошибка ${error.message}`);
  };
}());

class FormItem {
  constructor(options) {
    this.item = document.createElement('div');
    this.item.classList.add('form-item');
    this.label = document.createElement('label');
    this.label.innerHTML = '#1';
    if (options.labeltext) this.label.innerHTML = options.labeltext;
    this.input = document.createElement('textarea');
    this.input.value = '';
    if (options.value) this.input.value = options.value;
    this.close = document.createElement('button');
    this.close.innerHTML = 'X';
    this.close.classList.add('btn-close');

    this.close.addEventListener('click', (e) => {
      e.stopPropagation();
      this.item.remove();
    });

    this.item.append(this.label, this.input, this.close);
  }

  set text(text) {
    this.labeltext = text;
  }

  add() {
    return this.item;
  }
}

class FormItemDouble extends FormItem {
  constructor(options) {
    super(options);
    this.label.remove();
    this.input.remove();
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.label = document.createElement('input');
    // this.audio = document.createElement('audio');
    // this.audio.src = `./../${options.value.input}`;
    // this.audio.controls = true;
    this.label.type = 'text';
    this.item.append(this.label, this.input, this.close);
    this.label.value = options.value.label;
    this.input.value = options.value.input;
    // this.item.append(this.audio);
  }
}

class Form {
  constructor(options) {
    this.form = document.createElement('div');
    this.form.id = options.name;
    this.form.classList.add('form');

    this.title = document.createElement('h1');
    this.title.innerHTML = options.title;

    this.submit = document.createElement('button');
    this.submit.classList.add('btn');

    this.box = document.createElement('div');
    this.box.classList.add('input-box');

    this.submit.innerHTML = 'submit';
    if (options.adds) {
      this.addItem = document.createElement('button');
      this.addItem.classList.add('btn');
      this.addItem.innerHTML = '+ Добавить';
      this.addItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.box.append(new FormItem({ type: 'text', labeltext: `#${this.box.childNodes.length}` }).add());
      });
    } else {
      this.addItem = document.createElement('div');
    }
    this.submit.innerHTML = 'Сохранить';

    if (options.items && options.items.length > 0) {
      options.items.forEach((item) => {
        this.box.append(item);
      });
    } else {
      this.items = document.createElement('hr');
    }

    this.submit.addEventListener('click', (e) => {
      e.preventDefault();
      const messages = [];
      const areas = this.box.getElementsByTagName('textarea');

      for (let i = 0; i < areas.length; i += 1) {
        messages.push(areas[i].value);
      }
      ws.send(JSON.stringify({ event: options.name, message: messages }));
    });

    this.box.append(this.items);
    this.form.append(this.title, this.box, this.addItem, this.submit);
  }

  appendItem(item) {
    const i = item;
    i.text = `#${this.box.childNodes.length}`;
    this.box.append(i.add());
  }

  add() {
    return this.form;
  }
}

class Configurator {
  constructor() {
    this.dlinks = document.querySelector('#dlinks');
    this.prefix = document.querySelector('#prefix');
    this.qcd = document.querySelector('#qcd');
    this.mmr = document.querySelector('#mmr');
    this.media = {
      vk: document.querySelector('#media-link-vk'),
      db: document.querySelector('#media-link-db'),
      da: document.querySelector('#media-link-da'),
    };
    this.amsg = document.querySelector('#avt-msg-form');
    this.amsgForm = new Form({
      name: 'amsg-reconf', title: 'Автоматические сообщения', items: [], adds: true,
    });
    this.amsg.append(this.amsgForm.add());
    this.filter = document.querySelector('#filter-form');
    this.filterForm = new Form({
      name: 'filter-reconf', title: 'Нежелательные фразы', items: [], adds: false,
    });
    this.filter.append(this.filterForm.add());
    this.sounds = document.querySelector('#sounds-form');
    this.soundsForm = new Form({
      name: 'sounds-reconf', title: 'Список звуков', items: [], adds: false,
    });
    this.sounds.append(this.soundsForm.add());
    this.saveconf = document.querySelector('#saveconf');
    this.saveconf.addEventListener('click', () => {
      ws.send(JSON.stringify({ event: 'save-conf', message: this.configure() }));
    });
  }

  configure() {
    return {
      delay: this.dlinks.value,
      prefix: this.prefix.value,
      queueCD: this.qcd.value,
      manual: false,
      chat: true,
      mmr: this.mmr.value,
      links: {
        vk: this.media.vk.value,
        donationalerts: this.media.da.value,
        dotabuff: this.media.db.value,
      },
    };
  }

  async getConfiguration() {
    console.log(window.location.pathname);
    this.response = await fetch(`https://${window.location.hostname}:3443/configuration?id=${window.location.pathname.substr(1)}`);
    if (this.response.ok) {
      this.conf = await this.response.json();
    } else {
      alert(`Ошибка HTTP: ${this.response.status}`);
    }
    this.dlinks.value = this.conf.config.delay;
    this.prefix.value = this.conf.config.prefix;
    this.qcd.value = this.conf.config.queueCD;
    this.mmr.value = this.conf.config.mmr;
    this.media.vk.value = this.conf.config.links.vk;
    this.media.da.value = this.conf.config.links.donationalerts;
    this.media.db.value = this.conf.config.links.dotabuff;
    this.conf.amsg.m.forEach((message, index) => {
      this.amsgForm.appendItem(new FormItem({ type: 'text', labeltext: `#${index + 1}`, value: message }));
    });
    this.filterForm.appendItem(new FormItem({ type: 'text', labeltext: 'Фильтр Бан', value: this.conf.filter.words }));
    this.filterForm.appendItem(new FormItem({ type: 'text', labeltext: 'Фильтр Таймаут', value: this.conf.filter.timeout }));

    Object.keys(this.conf.sounds).forEach((command) => {
      this.soundsForm.appendItem(new FormItemDouble({ type: 'text', value: { label: command, input: this.conf.sounds[command].path } }));
    });
    (function addMenuEvents() {
      const main = document.getElementsByTagName('main')[0];
      const mainChildren = main.children;
      const list = document.querySelector('#list').children;
      for (let i = 0; (i < list.length) && (i < mainChildren.length); i += 1) {
        const element = mainChildren[i];
        const rect = element.getBoundingClientRect();
        console.log(rect);
        list[i].id = `link-${element.id}`;
        list[i].addEventListener('click', () => {
          console.log(rect.top);
          main.scrollTo({
            top: rect.top,
            behavior: 'smooth',
          });
        });
      }
    }());
  }
}

const conf = new Configurator();
conf.getConfiguration();
