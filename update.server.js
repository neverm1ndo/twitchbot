const express = require('express');
const fs = require('fs');

const app = express();
app.set('port', 8080);

app.get('/update', (req, res) => {
  console.log(req.headers);
  if (req.headers['client-id '] === '1') {
    res.send(fs.readFileSync(`${__dirname}/updates.json`));
  } else {
    res.send('No such client. Access denied');
  }
});

app.listen(app.get('port'));
