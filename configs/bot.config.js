module.exports = {
  interval : 1600000, // глобальный кулдаун автоматического постинга ссылок <- 10min
  delay : 400000, // делей между различными ссылками <- 2 min
  prefix : '!',
  manual : true,
  chat: true,
  silent: false,
  web: false,
  links : {
    vk: 'https://vk.com/diktoor',
    donationalerts: 'https://www.donationalerts.com/r/Diktor__',
    site: 'https://necessaryboost.pro/',
    dotabuff: 'https://www.dotabuff.com/players/120494497',
  },
  headers: {
    'Accept':  'application/vnd.twitchtv.v5+json',
    'Content-Type' : 'application/json',
    'Client-ID': 'ezap2dblocyxqnsjhl9dpyw1jpn8c7'
  },
  api: {
    id: '133676909', //Это твой ID на твиче
    url : 'https://api.twitch.tv/helix/streams?user_id=',
  },
  player: {
    type : 'mplayer',
    volume: {
      audio: -10,
      video: -20
    }
  }
};
