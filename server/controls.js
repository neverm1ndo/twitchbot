'use strict'


let skip = document.getElementById('skip');
let playpause = document.getElementById('playpause');
let mute = document.getElementById('mute');
let hide = document.getElementById('hide');
let play = document.getElementById('play');
let pause = document.getElementById('pause');
// let replay = document.getElementById('replay');
let volume = document.getElementById('volume');
let volumeVal = document.getElementById('volume_value');
let title = document.getElementById('playing');
let panel = document.getElementById('panel');
let body = document.body;
let ws;
let state = {
  playing: false,
  muted: false,
  hided: false
};

function setConnection() {
  ws = new WebSocket("ws://localhost:3001");
  ws.onopen = function() {
    console.log("Соединение установлено.");
    ws.send(JSON.stringify({event: 'controls-connection'}));
    ws.send(JSON.stringify({event: 'current-info'}));
    ws.send(JSON.stringify({event: 'current-state-request'}));
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
    switch (depeche.event) {
      case 'state':
      changeState(depeche.message);
      break;
      case 'video-data':
      showVideoData(JSON.parse(depeche.message));
      break;
      case 'current-state-data':
      syncState(depeche.message);
      break;
      default:
    }
  }

  ws.onerror = function(error) {
    console.log("Ошибка " + error.message);
  };
}

function changeState(monitorState) {
  console.log('Changed state : ', state);
  switch (monitorState) {
    case 'playing':
      state.playing = true;
      play.style.display = "none";
      pause.style.display = "inline-block";
      playpause.disabled = false;
      skip.disabled = false;

      break;
    case 'paused':
      state.playing = false;
      play.style.display = "inline-block";
      pause.style.display = "none";
      skip.disabled = false;
      playpause.disabled = false;
      break;
    case 'stoped':
      state.playing = false;
      play.style.display = "inline-block";
      pause.style.display = "none";
      skip.disabled = true;
      break;
    case 'muted':
      state.muted = true;
      break;
    case 'unmuted':
      state.muted = false;
      break;
    case 'hided':
      state.hided = true;
      break;
    case 'showed':
      state.hided = false;
      break;
  }
}

function showVideoData(data) {
  console.log(data);
  title.innerHTML = data.items["0"].snippet.title;
  panel.style.background = `url('${data.items["0"].snippet.thumbnails.high.url}') no-repeat 0 0`;
}

function syncState(state) {
  switch (state) {
    case -1:
    changeState('stoped')
    break;
    case 0:
      changeState('paused')
      break;
    case 1:
      changeState('playing')
      break;
    case 2:
      changeState('paused')
      break;
    case 5:
      changeState('stoped');
      break;
    default:

  }
}

document.addEventListener("DOMContentLoaded", setConnection);

skip.addEventListener('click', (event)=> {
  ws.send(JSON.stringify({event: 'remote', message: 'skip'}));
});
mute.addEventListener('click', (event)=> {
  ws.send(JSON.stringify({event: 'remote', message: 'mute'}));
});
hide.addEventListener('click', (event)=> {
  ws.send(JSON.stringify({event: 'remote', message: 'hide'}));
});
playpause.addEventListener('click', (event)=> {
  ws.send(JSON.stringify({event: 'remote', message: state.playing?'pause':'play'}));
});
volume.addEventListener('input', (event)=> {
  // console.log(event.target.value);
  volumeVal.innerHTML = event.target.value;
  ws.send(JSON.stringify({event: 'remote', message: 'volume', value: event.target.value}));
});