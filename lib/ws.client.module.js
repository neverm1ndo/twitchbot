const WebSocket = require('ws')

module.exports = class Client {
  constructor(url) {
    this.url = url;
    this.connection = new WebSocket(url);
    this.connection.onopen = () => {
      this.connection.send('Message From Client')
    }

    this.connection.onerror = (error) => {
      console.log(`WebSocket error: ${error}`)
    }

    this.connection.onmessage = (e) => {
      console.log(e.data)
    }
  }
}
