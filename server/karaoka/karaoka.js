class Karaoka {
  constructor(host) {
    this.ws = new WebSocket(host);
  }

  static showSubs(subs) {
    console.log(subs);
  }

  setConnection() {
    console.log(window.location.host);
    this.ws.onopen = () => {
      console.log('Соединение установлено.');
      this.ws.send(JSON.stringify({ event: 'karaoka-connection' }));
    };
    this.ws.onclose = (event) => {
      if (event.wasClean) {
        console.log('Соединение закрыто чисто');
      } else {
        console.log('Обрыв соединения');
        setTimeout(() => {
          console.log('Реконнект');
          this.setConnection();
        }, 5000);
      }
      console.log(`Code: ${event.code}\n Reason: ${event.reason}`);
    };

    this.ws.onmessage = (event) => {
      const depeche = JSON.parse(event.data);
      console.log(depeche);
      switch (depeche.event) {
        case 'captions-data': {
          Karaoka.showSubs(JSON.parse(depeche.message));
          const id = JSON.parse(depeche.message).items[1];
          fetch(`https://www.googleapis.com/youtube/v3/captions/${id}&key=`)
            .then((response) => console.log(response.text()));
          // .then(commits => alert(commits[0].author.login));
          break;
        }
        default: break;
      }
    };

    this.ws.onerror = (error) => {
      console.log(`Ошибка ${error.message}`);
    };
  }
}

const k = new Karaoka(`ws://${window.location.host.split(':')[0]}:3001`);
k.setConnection();
