'use strict'

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 })

wss.on('connection', (ws, req) => {
  ws.on('message', message => {
    console.log(`Received message from ${req.connection.remoteAddress} => ${message}`)
  })
  ws.send('WS: Successfully conected to local WS server')
})
