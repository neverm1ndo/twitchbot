/* eslint max-classes-per-file: ["error", 10] */

let ws;

(function setConnection() {
  ws = new WebSocket(`ws://${window.location.host.split(':')[0]}:3001`);
  console.log(window.location.host);
  ws.onopen = () => {
    console.log('Соединение установлено.');
    ws.send(JSON.stringify({ event: 'dashboard-connection' }));
  };

  ws.onclose = (event) => {
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
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
      default:
    }
  };

  ws.onerror = (error) => {
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

class Form {
  constructor(options) {
    this.form = document.createElement('div');
    this.form.classList.add('form');
    this.title = document.createElement('h1');
    this.title.innerHTML = options.title;
    this.submit = document.createElement('button');
    this.box = document.createElement('div');
    this.box.classList.add('input-box');
    this.submit.innerHTML = 'submit';
    this.addItem = document.createElement('button');
    this.addItem.innerHTML = 'add';
    this.submit.innerHTML = 'save';

    if (options.items && options.items.length > 0) {
      options.items.forEach((item) => {
        this.box.append(item);
      });
    } else {
      this.items = document.createElement('hr');
    }

    this.addItem.addEventListener('click', (e) => {
      e.preventDefault();
      this.box.append(new FormItem({ type: 'text', labeltext: `#${this.box.childNodes.length}` }).add());
    });
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
    this.amsgForm = new Form({ name: 'amsg-reconf', title: 'Автоматические сообщения', items: [] });
    this.amsg.append(this.amsgForm.add());
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
    this.response = await fetch(`http://localhost:3000/configuration?id=${window.location.pathname.substr(1)}`);
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
  }
}

const conf = new Configurator();
conf.getConfiguration();
