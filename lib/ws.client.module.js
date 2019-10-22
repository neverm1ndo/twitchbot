const WebSocket = require('ws')

module.exports = class Client {
  constructor(url) {
    this.url = url;
    this.connection = new WebSocket(url);
    this.connection.onopen = () => {
      this.connection.send('\x1b[32mWebSocket: Client connected\x1b[0m');
      console.log('\x1b[32mWebSocket: Client connected\x1b[0m');
    }

    this.connection.onerror = (error) => {
      console.log(`\x1b[31mWebSocket error: ${error.message}\x1b[0m`)
    }

    this.connection.onmessage = (e) => {
      console.log(e.data)
    }
  }
  send(str) {
    this.connection.send(str);
  }
}
