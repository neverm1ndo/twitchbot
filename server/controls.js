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
let muteOn = document.getElementById('mute_on');
let muteOff = document.getElementById('mute_off');
let hideOn = document.getElementById('hide_on');
let hideOff = document.getElementById('hide_off');
let body = document.body;
let error = document.getElementById('error');
let ws;
let state = {
  playing: false,
  muted: false,
  hided: false
};

hide.disabled = true;

function setConnection() {
  ws = new WebSocket(`ws://${window.location.host.split(':')[0]}:3001`);
    console.log(window.location.host);
  ws.onopen = function() {
    console.log("Соединение установлено.");
    ws.send(JSON.stringify({event: 'controls-connection'}));
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
      hide.disabled = false;
      break;
    case 'paused':
      state.playing = false;
      play.style.display = "inline-block";
      pause.style.display = "none";
      skip.disabled = false;
      playpause.disabled = false;
      hide.disabled = false;
      break;
    case 'stoped':
      state.playing = false;
      play.style.display = "inline-block";
      pause.style.display = "none";
      skip.disabled = true;
      hide.disabled = true;
      break;
    case 'muted':
      state.muted = true;
      break;
    case 'unmuted':
      state.muted = false;
      break;
    case 'hided':
      state.hided = true;
      hideOn.style.display = "inline-block";
      hideOff.style.display = "none";
      break;
    case 'showed':
      state.hided = false;
      hideOff.style.display = "inline-block";
      hideOn.style.display = "none";
      break;
  }
}

function showVideoData(data) {
  console.log(data);
  title.innerHTML = data.items["0"].snippet.title;
  try {
    panel.style.background = `url('${data.items["0"].snippet.thumbnails.maxres.url}') no-repeat 0 0`;
  } catch (e) {
    console.log(e);
    panel.style.background = `rgba(0, 0, 0, 1)`;
  }
}

function showMute() {
  if (state.muted) {
    muteOn.style.display = "inline-block";
    muteOff.style.display = "none";
  }
  else {
    muteOn.style.display = "none";
    muteOff.style.display = "inline-block";
  }
}
function showHide() {
  if (state.hided) {
    hideOn.style.display = "inline-block";
    hideOff.style.display = "none";
  }
  else {
    hideOn.style.display = "none";
    hideOff.style.display = "inline-block";
  }
}

function syncState(newstate) {
  console.log(newstate);
  volume.value = newstate.volume;
  volumeVal.innerHTML = newstate.volume;
  state.muted = newstate.muted;
  if (state.playing !== '') error.style.display = 'none';
  showMute();
  showHide();
  switch (newstate.state) {
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
  state.muted = state.muted?false:true;
  state.muted?ws.send(JSON.stringify({event: 'remote', message: 'mute', value: volume.value})):
              ws.send(JSON.stringify({event: 'remote', message: 'unmute', value: volume.value}));
  showMute();
});
hide.addEventListener('click', (event)=> {
  if (state.playing) {
    state.hided = state.hided?false:true;
    state.hided?ws.send(JSON.stringify({event: 'remote', message: 'hide'})):
    ws.send(JSON.stringify({event: 'remote', message: 'show'}));
    showHide();
  }
});
playpause.addEventListener('click', (event)=> {
  ws.send(JSON.stringify({event: 'remote', message: state.playing?'pause':'play'}));
});
volume.addEventListener('input', (event)=> {
  // console.log(event.target.value);
  volumeVal.innerHTML = event.target.value;
  ws.send(JSON.stringify({event: 'remote', message: 'volume', value: event.target.value}));
});
