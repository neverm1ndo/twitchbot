'use strict'

let fs = require('fs');
let http = require('http');
let request = require('request');

module.exports = class Updater() {
	this.controlSumm = fs.readFileSync(__dirname + './csumm');
	
	constructor() {}
	
	update() {
		request('http:/localhost:3002', function(error, response, body) {
			if (response) {
				fs.writeFile(__dirname + '../etc/sounds.library.json', response, (err) => {
					if(err) throw err;
					console.log('Sounds library updated');
				});
			}
		}	
	}
}
