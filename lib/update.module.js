'use strict'

let fs = reqire('fs');

module.exports = class Update() {
	this.controlSumm = fs.readFileSync('./csumm.d');
	constructor() {}
}
