#!/usr/bin/env sh

process.stdout.write('\x1B[?25l');

const OMD = require('./lib/core.module');
const Schedule = require('./lib/omd.schedule');

const omd = new OMD({ schedule: new Schedule() });
omd.init();
omd.setControls();
