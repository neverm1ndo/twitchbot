'use strict'
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/player_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player;
let ws = new WebSocket("ws://localhost:3001");
let queue = [];
let playing = false;

ws.onopen = function() {
  console.log("Соединение установлено.");
};

ws.onclose = function(event) {
  if (event.wasClean) {
    console.log('Соединение закрыто чисто');
  } else {
    console.log('Обрыв соединения');
  }
  console.log('Код: ' + event.code + ' причина: ' + event.reason);
};


ws.onerror = function(error) {
  console.log("Ошибка " + error.message);
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
  }).then(()=> {
    console.log('player loaded');
    ws.send(JSON.stringify({event: 'ytp-loaded', message: 'YT-Player is loaded...'}));
  });
}

ws.onmessage = (event) => {
  let depeche = JSON.parse(event.data);
  console.log(depeche);
  switch (depeche.event) {
    case 'play':
      if (checkQueue(depeche.chatter) && !playing) {
        console.log('received message from server: ', depeche);
        player.loadVideoById(depeche.message);
        queue.push(depeche.chatter);
        playing = true;
        setTimeout(() => {
          queue.pop(depeche.chatter);
        }, 15*60000);
      }
      break;
    default:
    console.error('something wrong');
  }
};

function onPlayerReady(event) {
  // event.target.playVideo();
}

function closeWindow(event) {
  console.log(event);
  if (event.data == 0) {
    // player.destroy();
    playing = false;
  }
}
