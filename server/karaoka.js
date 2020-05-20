class Karaoka {
  constructor(host) {
    this.ws = new WebSocket(host);
  }
  showSubs(subs) {
   console.log(subs);
  }
  setConnection() {
    console.log(window.location.host);
    this.ws.onopen = () => {
      console.log("Соединение установлено.");
      this.ws.send(JSON.stringify({event: 'karaoka-connection'}));
    };
    this.ws.onclose = (event) => {
      if (event.wasClean) {
        console.log('Соединение закрыто чисто');
      } else {
        console.log('Обрыв соединения');
        setTimeout(()=> {
          console.log('Реконнект');
          this.setConnection();
        }, 5000)
      }
      console.log('Code: ' + event.code + '\n Reason: ' + event.reason);
    };

    this.ws.onmessage = (event) => {
      let depeche = JSON.parse(event.data);
      console.log(depeche);
      switch (depeche.event) {
        case 'captions-data':
          this.showSubs(JSON.parse(depeche.message));
          let id = JSON.parse(depeche.message).items[1].id;
          fetch(`https://www.googleapis.com/youtube/v3/captions/${id}&key=`)
                .then(response => console.log(response.text()));
                // .then(commits => alert(commits[0].author.login));
        break;
        default:
      }
    }

    this.ws.onerror = function(error) {
      console.log("Ошибка " + error.message);
    };
  }
}

let k = new Karaoka(`ws://${window.location.host.split(':')[0]}:3001`);
    k.setConnection();
