let ws;
class Filter {
  constructor() {
  }
  static separate (text) {
    const schedule = ['/^', 'пидор', 'пидр', 'пидарас', 'пидорас'];
    schedule.forEach((word) => {
    text = text.replace(new RegExp(`${word}`, 'gi'), 'уууууу');
    });
    return text;
  }
}
class Player {
  constructor() {
    this.audio = new Audio();
    this.audio.src = undefined;
    this.audio.controls = false;
    this.audio.autoplay = true;
    this.audio.volume = window.localStorage.getItem('volumePlayer');

    document.body.appendChild(this.audio);

    this.playerRanger = document.querySelector('#volume2');
    this.playerRanger.value = this.audio.volume*100;
    document.querySelector('#sou_vol').innerHTML = this.playerRanger.value;
    this.playerRanger.addEventListener('input', () => {
      this.audio.volume = this.playerRanger.value/100;
      document.querySelector('#sou_vol').innerHTML = this.playerRanger.value;
      window.localStorage.setItem('volumePlayer', this.audio.volume);
    });
  }
  set vol(volume) {
    this.audio.volume = volume;
  }
  loadSource(path) {
    this.audio.src = path;
    this.audio.load();
    this.audio.play();
  };
}

let player;
player = new Player();

class Speaker2 {
  constructor() {
    this.synth = window.speechSynthesis;
    // this.synth2 = window.speechSynthesis;
    this.controls = {
      accept: document.querySelector('#accept'),
      volume: document.querySelector('#volume')
    }
    this.volume = null;
    if (window.localStorage.getItem('volume')) {
      this.volume = window.localStorage.getItem('volume');
    } else {
      this.volume = 1;
    }
    this.controls.volume.value = this.volume*100;

    this.indicator = document.querySelector('#sp_vol');
    this.indicator.innerHTML = this.controls.volume.value;

    this.controls.accept.addEventListener('click', (e)=> {
      e.target.style.display = 'none';
      this.controls.volume.style.display = 'block';
    });

    this.controls.volume.addEventListener('input', (e) => {
      this.volume = e.target.value/100;
      this.indicator.innerHTML = e.target.value;
      window.localStorage.setItem('volume', this.volume);
    });
    this.pitch = 1;
    this.rate = 1;

    this.voices = [];
    console.log(Sheet.note.A);
  }

  async populateVoiceList() {
    await new Promise((resolve, reject) => {
      let id;
      id = setInterval(() => {
          if (this.synth.getVoices().length !== 0) {
              resolve(this.synth.getVoices());
              clearInterval(id);
          } else {
            reject('Reject in promise: setSpeech()');
          }
      }, 100);
    }).then((voices) => { this.voices = voices });
    this.voices = this.voices.sort(function (a, b) {
      const aname = a.name.toUpperCase(), bname = b.name.toUpperCase();
      if ( aname < bname ) return -1;
      else if ( aname == bname ) return 0;
      else return +1;
    });
  };

  speak(text, pitch) {
    if (pitch == undefined) { pitch = this.pitch};
    if (text !== '') {
      let selectedOption;
      if (text.includes(' --p ')) {
        let params = text.split(' --p ');
            text = params[0];
            selectedOption = this.voices[params[1].split('|')[0]].name;
            pitch = +params[1].split('|')[1];
      } else {
          selectedOption = 'Google русский';
      }
      let utterThis = new SpeechSynthesisUtterance(text);
      for(let i = 0; i < this.voices.length ; i++) {
        if(this.voices[i].name === selectedOption) {
          utterThis.voice = this.voices[i];
          break;
        }
      }
      utterThis.pitch = pitch;
      utterThis.rate = this.rate;
      utterThis.volume = this.volume;
      this.synth.speak(utterThis);
    }
  }

  parseSong(text) {
    const rText = new RegExp('\\w+\=\\w','g');
    const matched = text.match(rText);
    let parsed = [];
    matched.forEach((m, index) => {
      const t = matched[index].split('=');
      parsed.push({text: t[0], pitch: Sheet.note[t[1]]});
    });
    console.log(parsed);
    return parsed;
  }

  async sing (text) {
    const parsed = this.parseSong(text);
    for (let i = 0; parsed.length > i; i+=1) {
      await new Promise((resolve, reject) => {
        this.speak(parsed[i].text, parsed[i].pitch);
        let int = setInterval(()=> {
          if (this.synth.pending) {
            clearInterval(int);
          }
          if (!this.synth.speaking) {
            resolve(+parsed[i].pitch);
          }
        }, 10);
      });
    }
  }
}

const speaker = new Speaker2();
      speaker.populateVoiceList();

(function setConnection() {
  ws = new WebSocket(`ws://${window.location.host}:3000`);
    console.log(window.location.host);
  ws.onopen = function() {
    console.log("Соединение установлено.");
    ws.send(JSON.stringify({event: 'speaker-connection'}));
    // speaker.sing('[taaaaaaaaa=C][taaaaaaaaa=D][taaaaaaaaa=E][taaaaaaaaa=F][taaaaaaaaa=G][taaaaaaaaa=A][taaaaaaa=B][taaaaaaaaa=C]')
  };

  ws.onclose = function(event) {
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
      setTimeout(()=> {
        setConnection();
      }, 5000)
    }
    console.log('Code: ' + event.code + '\n Reason: ' + event.reason);
  };

  ws.onmessage = (event) => {
    let depeche = JSON.parse(event.data);
    console.log(depeche);
    switch (depeche.event) {
      case 'hl_msg':
      console.log(depeche.message);
        speaker.speak(Filter.separate(depeche.message));
      break;
      case 'sound_msg':
        player.loadSource(depeche.message);
      break;
      case 'connection':
        console.log(depeche.message);
      break;
      default:
    }
  }

  ws.onerror = function(error) {
    console.log("Ошибка " + error.message);
  };
})();
