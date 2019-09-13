'use strict'
let colides = {
  corner: '+',
  border: {
    vertical: '|',
    horizontal: '-'
  },
  margin: '     '
}
module.exports = class Table {
  constructor() {}

  static strLength(str, max) {
    str = str.toString();
    let length = max - str.length;
    for (let i = 0; i<length; i++) {
        str = str + ' ';
    }
    return ` ${str} `;
  }

  static borderLength(length) {
    let line = '';
    for (let i = 0; i<=length + 2; i++) {
      if ((i!=length)) {
        line = line + colides.border.horizontal;
      }
    }
    return line;
  }
  static drawHead(maxes) {
    process.stdout.write(` ${colides.margin}+${this.borderLength(maxes.maxcol+ maxes.maxrow + 3)}+\n`);
    process.stdout.write(` ${colides.margin}|${this.strLength('Info', maxes.maxcol)}|${this.strLength('Value', maxes.maxrow)}|\n`);
  }
  static draw(col, value, maxes) {
    if (process.stdout.columns - (maxes.maxcol + 19) <= value.length ) {
      value = value.slice(0, process.stdout.columns - (maxes.maxcol + 22)) + '...';
    }
    process.stdout.write(` ${colides.margin}|${this.strLength(col, maxes.maxcol)}|${this.strLength(value, maxes.maxrow)}|\n`);
  }
  static drawLine(maxes) {
    process.stdout.write(` ${colides.margin}+${this.borderLength(maxes.maxcol)}+${this.borderLength(maxes.maxrow)}+\n`);
  }

  static getMax(obj) {
    let maxcol = 0;
    let maxrow = 0;
    for(let key in obj) {
      if (key.length > maxcol) {
        maxcol = key.length;
      }
      if (obj[key] !== null) {
        if (obj[key].length > maxrow) {
          maxrow = obj[key].toString().length;
        }
      } else {
          obj[key] = `No ${key}`;
          maxrow = obj[key].length;
      }
    }
    if ((maxcol + maxrow + 8) > process.stdout.columns) {
      maxrow = process.stdout.columns - (maxcol + 19);
    }
    return {maxcol, maxrow};
  }

  static build(object) {
    let maxes = this.getMax(object);
    this.drawHead(maxes);
    this.drawLine(maxes);
    for(let key in object) {
      if (typeof object[key] !== 'object') {
        this.draw(key, object[key], maxes);
      }
    }
    this.drawLine(maxes);
  }
}
