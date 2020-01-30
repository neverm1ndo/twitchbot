'use strict'

let fs = require('fs');
let http = require('http');
let request = require('request');

module.exports = class Updater() {
	constructor() {
		this.controlSumm = fs.readFileSync(__dirname + './csumm');
	}

	checkUpdate() {
		request('http://localhost:3002', function(error, response, body) {
			if (response) {
				if (response.csumm !== this.controlSumm) {
					fs.writeFile(__dirname + '../etc/sounds.library.json', response.library, (err) => {
						if(err) throw err;
						console.log('Sounds library updated');
					});
				} else {
					console.log(`Bot is out of date ---------- \n Control summ: ${this.controlSumm}`);
				}
			}
		}
	}
}
