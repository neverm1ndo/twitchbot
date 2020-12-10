const skip = document.getElementById('skip');
const playpause = document.getElementById('playpause');
const mute = document.getElementById('mute');
const hide = document.getElementById('hide');
const play = document.getElementById('play');
const pause = document.getElementById('pause');
const volume = document.getElementById('volume');
const volumeVal = document.getElementById('volume_value');
const title = document.getElementById('playing');
const panel = document.getElementById('panel');
const muteOn = document.getElementById('mute_on');
const muteOff = document.getElementById('mute_off');
const hideOn = document.getElementById('hide_on');
const hideOff = document.getElementById('hide_off');
const error = document.getElementById('error');
let ws;
const state = {
  playing: false,
  muted: false,
  hided: false,
};

hide.disabled = true;

function showMute() {
  if (state.muted) {
    muteOn.style.display = 'inline-block';
    muteOff.style.display = 'none';
  } else {
    muteOn.style.display = 'none';
    muteOff.style.display = 'inline-block';
  }
}
function showHide() {
  if (state.hided) {
    hideOn.style.display = 'inline-block';
    hideOff.style.display = 'none';
  } else {
    hideOn.style.display = 'none';
    hideOff.style.display = 'inline-block';
  }
}

function showVideoData(data) {
  console.log(data);
  title.innerHTML = data.items['0'].snippet.title;
  try {
    panel.style.background = `url('${data.items['0'].snippet.thumbnails.maxres.url}') no-repeat 0 0`;
  } catch (e) {
    console.log(e);
    panel.style.background = '#1f1e1f';
  }
}

function changeState(monitorState) {
  console.log('Changed state : ', state);
  switch (monitorState) {
    case 'playing':
      state.playing = true;
      play.style.display = 'none';
      pause.style.display = 'inline-block';
      playpause.disabled = false;
      skip.disabled = false;
      hide.disabled = false;
      changeState('showed');
      break;
    case 'paused':
      state.playing = false;
      play.style.display = 'inline-block';
      pause.style.display = 'none';
      skip.disabled = false;
      playpause.disabled = false;
      hide.disabled = false;
      break;
    case 'stoped':
      state.playing = false;
      play.style.display = 'inline-block';
      pause.style.display = 'none';
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
      hideOn.style.display = 'inline-block';
      hideOff.style.display = 'none';
      break;
    case 'showed':
      state.hided = false;
      hideOff.style.display = 'inline-block';
      hideOn.style.display = 'none';
      break;
    default:
      break;
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
      changeState('stoped');
      break;
    case 0:
      changeState('paused');
      break;
    case 1:
      changeState('playing');
      break;
    case 2:
      changeState('paused');
      break;
    case 5:
      changeState('stoped');
      break;
    default:
  }
}

function setConnection() {
  ws = new WebSocket(`ws://${window.location.host.split(':')[0]}`);
  console.log(window.location.host);
  ws.onopen = () => {
    console.log('Соединение установлено.');
    ws.send(JSON.stringify({ event: 'controls-connection' }));
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
  };

  ws.onerror = (err) => {
    console.log(`Ошибка ${err.message}`);
  };
}

document.addEventListener('DOMContentLoaded', setConnection);

skip.addEventListener('click', () => {
  ws.send(JSON.stringify({ event: 'remote', message: 'skip' }));
});
mute.addEventListener('click', () => {
  state.muted = !state.muted;
  if (state.muted) {
    ws.send(JSON.stringify({ event: 'remote', message: 'mute', value: volume.value }));
  } else {
    ws.send(JSON.stringify({ event: 'remote', message: 'unmute', value: volume.value }));
  }
  showMute();
});
hide.addEventListener('click', () => {
  if (state.playing) {
    state.hided = !state.hided;
    if (state.hided) {
      ws.send(JSON.stringify({ event: 'remote', message: 'hide' }));
    } else { ws.send(JSON.stringify({ event: 'remote', message: 'show' })); }
    showHide();
  }
});
playpause.addEventListener('click', () => {
  ws.send(JSON.stringify({ event: 'remote', message: state.playing ? 'pause' : 'play' }));
});
volume.addEventListener('input', (event) => {
  volumeVal.innerHTML = event.target.value;
  ws.send(JSON.stringify({ event: 'remote', message: 'volume', value: event.target.value }));
});
