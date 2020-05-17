'use strict'

let ws = new WebSocket('ws://localhost:8080');

function setConnection() {  
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
    // switch (depeche.event) {
      //   case 'state':
      //   changeState(depeche.message);
      //   break;
      //   case 'video-data':
      //   showVideoData(JSON.parse(depeche.message));
      //   break;
      //   case 'current-state-data':
      //   syncState(depeche.message);
      //   break;
      //   default:
      // }
    }

    ws.onerror = function(error) {
      console.log("Ошибка " + error.message);
    };
}
