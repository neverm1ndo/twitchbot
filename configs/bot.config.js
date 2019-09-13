module.exports = {
  interval : 600000, // глобальный кулдаун автоматического постинга ссылок <- 10min
  delay : 120000, // делей между различными ссылками <- 2 min
  prefix : '!',
  links : {
    vk: 'https://vk.com/necessaryevil0',
    donationalerts: 'https://www.donationalerts.com/r/necessaryevil0',
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
    // id: '40022691',
    url : 'https://api.twitch.tv/helix/streams?user_id=',
  }
};
