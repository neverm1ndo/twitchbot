'use strict'

var express = require('express');
const fs = require('fs');
var app = express();
app.set('port', 8080);

app.get('/update', (req, res) => {
  res.send(fs.readFileSync(__dirname + './sounds.library.json'));
});

app.get('/check-summ', (req, res) => {
  res.send(fs.readFileSync(__dirname + './summ'));
});

app.listen(app.get('port'));
