'use strict'
let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/player_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player, remote;
let ws;
let connectionCounts = 0;

function setConnection() {
  connectionCounts++;
  ws = new WebSocket("ws://localhost:3001");
  ws.onopen = function() {
    console.log("Соединение установлено.");
    if (connectionCounts > 1) {
      ws.send(JSON.stringify({event: 'ytp-loaded', message: 'YT-Player is loaded...'}));
    }
  };
  ws.onclose = function(event) {
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
      setTimeout(()=> {
        setConnection();
      }, 5000);
    }
    console.log('Code: ' + event.code + '\n Reason: ' + event.reason);
  };
  ws.onerror = function(error) {
    console.log("Ошибка " + error.message);
  };
  ws.onmessage = (event) => {
    let depeche = JSON.parse(event.data);
    switch (depeche.event) {
      case 'play':
          player.loadVideoById(depeche.message);
          ws.send(JSON.stringify({event: 'state', message: 'playing'}));
  	      document.getElementById("ytplayer").style.display = "block";
        break;
      case 'remote':
        remote.select(depeche.message, depeche.value);
        break;
      case 'current-state-request':
        ws.send(JSON.stringify({event:'current-state-data', message: player.getPlayerState()}));
        break;
      default:
      console.error('something wrong');
    }
  };
};
setConnection();

function Remote() {
  this.element = document.getElementById("ytplayer");
}

Remote.prototype.play = function () {
  player.playVideo();
  ws.send(JSON.stringify({event: 'state', message: 'playing'}));
  this.element.style.display = "block";
};
Remote.prototype.pause = function () {
  player.pauseVideo();
  ws.send(JSON.stringify({event: 'state', message: 'paused'}));
  this.element.style.display = "block";
};
Remote.prototype.stop = function () {
    player.stopVideo();
    this.element.style.display = "none";
    ws.send(JSON.stringify({event: 'state', message: 'stoped'}));
};
Remote.prototype.hide = function () {
  this.element.style.display = "none";
};
Remote.prototype.show = function () {
  this.element.style.display = "block";
};

Remote.prototype.select = function (e, val) {
  switch (e) {
    case 'skip':
      remote.stop();
    break;
    case 'mute':

    break;
    case 'play':
      remote.play();
    break;
    case 'pause':
      remote.pause();
    break;
    case 'hide':
      // player.plauseVideo();
    break;
    case 'volume':
      player.setVolume(val);
    break;
    default:

  }
};


function checkQueue(chatter) {
  return !queue.includes(chatter);
}

function onYouTubePlayerAPIReady() {
  new Promise((resolve, reject) => {
    player = new YT.Player('ytplayer', {
      height: '100%',
      width: '100%',
      // videoId: 'sEWx6H8gZH8',
      events: {
        'onReady': resolve,
        'onStateChange': closeWindow
      }
    });
  }).then((event) => {
      remote = new Remote();
      event.target.setVolume(15);
  	  document.getElementById("ytplayer").style.display = "none";
      console.log('player loaded');
      ws.send(JSON.stringify({event: 'ytp-loaded', message: 'YT-Player is loaded...'}));
  });
}

function closeWindow(event) {
  ws.send(JSON.stringify({event: 'state-change', message: event.data}));
  if (event.data == 0) {
    // player.destroy();
    playing = false;
	  document.getElementById("ytplayer").style.display = "none";
    ws.send(JSON.stringify({event: 'state', message: 'stoped'}));
  }
}
