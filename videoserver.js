module.exports = function videoserver() {
  var express = require('express');
  var path = require('path');
  const WebSocket = require('ws');

  var app = express();
  const wss = new WebSocket.Server({ port: 3001 });
  const fs = require('fs');
  const request = require('request');

  let key = JSON.parse(fs.readFileSync(__dirname + '/etc/google.api.key.json'));
  let monitor, controls, currentVideo;
  let playerState = {
    state: 0,
    volume: 0,
    muted: 0
  };
  let usersQueue = [];
  let videoQueue = [];

  app.use(express.static(path.join(__dirname, 'server')));
  app.get('/', function (req, res) {
    // res.send('No Video Displayed');
    res.sendFile(__dirname + '/index.html');
  });
  app.get('/controls', function (req, res) {
    // res.send('No Video Displayed');
    res.sendFile(__dirname + '/server/controls.html');
  });

  app.listen(3000, function () {
    console.log('Video server listening on port 3000! Add http://localhost:3000 to your OBS browser!\n');
  });

  function extractVideoID(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if ( match && match[7].length == 11 ){
        return match[7];
    } else {
        console.error("\x1b[31mCould not extract video ID.\x1b[0m");
    }
  }

   function getVideoInfo(id) {
    let options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=${key.key}`,
      method: 'GET',
    };
    new Promise ((resolve, reject) => {
      request(options,(error, response, body) => {
        if (response) {
          resolve(body);
        } else {
          reject();
        }
      });
    }).then((body) => {
      currentVideo = body;
      controls.send(JSON.stringify({event: 'video-data', message: body }));;
    });
  };

  function getVideoStats(id) {
    let options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=statistics&key=AIzaSyDxNpfimMSGenDUXELOC0tTBeQrsuJImKI`,
      method: 'GET',
    };
    return new Promise ((resolve, reject) => {
      request(options,(error, response, body) => {
        if (response) {
          resolve(body);
        } else {
          reject();
        }
      });
    })
  }

  function toTimeout(chatter) {
    setTimeout(() => {
      usersQueue.forEach((user, index) => {
        if (user == chatter) {
          usersQueue.splice(index, index + 1);
          console.log('Chatter ', chatter, ' removed from queue ', usersQueue);
        };
      })
    }, 15*60000);
  }

  function checkQueue(message) {
    console.log(playerState);
    return new Promise((resolve, reject) => {
      if (!usersQueue.includes(message.chatter) && (playerState.state==0 || playerState.state==-1 || playerState.state ==5)) {
        usersQueue.push(message.chatter);
        console.log(usersQueue, playerState.state);
        toTimeout(message.chatter);
        resolve(message);
      // } else if (!usersQueue.includes(message.chatter) && (state==1 || state==2 || state ==3)) {
      //   videoQueue.push(message);
      } else {
        reject(message);
      }
    });
  }

  function nextQueueTrack() {
    videoQueue.pop(0);
    playVideo(videoQueue[0]);
  }

  function changeState(newstate) {
    // console.log('State changed > ', newstate);
    playerState = newstate;
    // if (state == 0 && videoQueue.length > 0) {
    //   nextQueueTrack();
    // }
  }

  function playVideo(message) {
    let ID = extractVideoID(message.message);
    console.log(ID);
    getVideoStats(ID).then((body) => {
      if (+JSON.parse(body).items['0'].statistics.viewCount > 20000) {
        getVideoInfo(ID);
        monitor.send(JSON.stringify({event: 'play', message: ID, chatter: message.chatter}));
      };
    });
  }

  wss.on('connection', (ws) => {
    ws.on('message', function incoming(message) {
      message = JSON.parse(message);
      switch (message.event) {
        case 'ytp-loaded':
          monitor = ws;// ws.send(JSON.stringify({event: 'play', message: 'sEWx6H8gZH8'}));
          monitor.send(JSON.stringify({event: 'current-state-request'}));
          console.log('> \x1b[32mMonitor connected\x1b[0m', ' localhost:3000');
          monitor
        break;
        case 'controls-connection':
          controls = ws;// ws.send(JSON.stringify({event: 'play', message: 'sEWx6H8gZH8'}));
          try { monitor.send(JSON.stringify({event: 'current-state-request'})); }
          catch (e) { console.log ('ERROR: Waiting for monitor...')}
          if (currentVideo) {
            controls.send(JSON.stringify({event: 'video-data', message: currentVideo}));
          }
          console.log('> \x1b[32mControls connected\x1b[0m', ' localhost:3000/controls');
        break;
        case 'remote':
          if (monitor) monitor.send(JSON.stringify({event: 'remote', message: message.message, value: message.value}));
        break;
        case 'current-info':
          if (currentVideo) {
            controls.send(JSON.stringify({event: 'video-data', message: currentVideo}));
          }
        break;
        case 'current-state-request':
          if (monitor) { monitor.send(JSON.stringify({event: 'current-state-request'})) }
          else {console.log('> \x1b[31mMonitor in not connected, wait...\x1b[0m If monitor not connects automatically for long time, open or refresh it manually in OBS.\x1b[0m');}
        break;
        case 'current-state-data':
          changeState(message.message);
          if (controls) {
            controls.send(JSON.stringify({event: 'current-state-data', message: message.message}));
          } else {
            console.log('> \x1b[31mControls in not connected, wait...\x1b[0m If controls not connects automatically for long time, open or refresh it browser localhost:3000/controls .\x1b[0m');
          }
        break;
        case 'state':
          if (controls) controls.send(JSON.stringify(message));
        break;
        case 'bot-play':
        checkQueue(message).then((message) => {
          playVideo(message);
        }).catch((message) => {
          console.log('> ', message.chatter, ' in queue...');
        });
        break;
        default:
          console.log('> Not responded message: ', message);
      }
    });
  });
}
