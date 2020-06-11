const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/player_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player;
let remote;
let ws;
let connectionCounts = 0;

function setConnection() {
  connectionCounts += 1;
  ws = new WebSocket(`ws://${window.location.host.split(':')[0]}:3001`);
  ws.onopen = () => {
    console.log('Соединение установлено.');
    if (connectionCounts > 1) {
      ws.send(JSON.stringify({ event: 'ytp-loaded', message: 'YT-Player is loaded...' }));
    }
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
  ws.onerror = (error) => {
    console.log(`Ошибка ${error.message}`);
  };
  ws.onmessage = (event) => {
    const depeche = JSON.parse(event.data);
    switch (depeche.event) {
      case 'play':
        player.loadVideoById(depeche.message);
        ws.send(JSON.stringify({ event: 'state', message: 'playing' }));
        document.getElementById('ytplayer').style.display = 'block';
        break;
      case 'remote':
        remote.select(depeche.message, depeche.value);
        break;
      case 'current-state-request':
        ws.send(JSON.stringify({ event: 'current-state-data', message: { state: player.getPlayerState(), volume: player.getVolume(), muted: player.isMuted() } }));
        break;
      default:
        console.error('something wrong');
    }
  };
}
setConnection();

function Remote() {
  this.element = document.getElementById('ytplayer');
}

Remote.prototype.play = () => {
  player.playVideo();
  ws.send(JSON.stringify({ event: 'state', message: 'playing' }));
  this.element.style.display = 'block';
};
Remote.prototype.pause = () => {
  player.pauseVideo();
  ws.send(JSON.stringify({ event: 'state', message: 'paused' }));
  this.element.style.display = 'block';
};
Remote.prototype.stop = () => {
  player.stopVideo();
  this.element.style.display = 'none';
  ws.send(JSON.stringify({ event: 'state', message: 'stoped' }));
};
Remote.prototype.hide = () => {
  this.element.style.display = 'none';
  ws.send(JSON.stringify({ event: 'state', message: 'hided' }));
};
Remote.prototype.show = () => {
  this.element.style.display = 'block';
  ws.send(JSON.stringify({ event: 'state', message: 'showed' }));
};

Remote.prototype.select = (e, val) => {
  switch (e) {
    case 'skip':
      remote.stop();
      break;
    case 'mute':
      player.mute();
      break;
    case 'unmute':
      player.unMute();
      break;
    case 'play':
      remote.play();
      break;
    case 'pause':
      remote.pause();
      break;
    case 'hide':
      remote.hide();
      break;
    case 'show':
      remote.show();
      break;
    case 'volume':
      player.setVolume(val);
      break;
    default:
  }
};

function closeWindow(event) {
  ws.send(JSON.stringify({ event: 'current-state-data', message: { state: event.data, volume: player.getVolume(), muted: player.isMuted() } }));
  if (event.data === 0) {
    document.getElementById('ytplayer').style.display = 'none';
    ws.send(JSON.stringify({ event: 'state', message: 'stoped' }));
  }
}
/* eslint no-unused-vars: "off" */
/* global YT */
function onYouTubePlayerAPIReady() {
  new Promise((resolve) => {
    player = new YT.Player('ytplayer', {
      height: '100%',
      width: '100%',
      events: {
        onReady: resolve,
        onStateChange: closeWindow,
      },
    });
  }).then((event) => {
    remote = new Remote();
    event.target.setVolume(15);
    document.getElementById('ytplayer').style.display = 'none';
    console.log('player loaded');
    ws.send(JSON.stringify({ event: 'ytp-loaded', message: 'YT-Player is loaded...' }));
  });
}
