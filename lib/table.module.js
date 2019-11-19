'use strict'
let colides = {
    corner: '+',
    border: {
      vertical: '│',
      horizontal: '─'
    },
    margin: ' ',
    less: ' '
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
  static drawHead(maxes, col1, col2, width) {
    if (width == undefined) {
      width = process.stdout.columns;
    }
    process.stdout.write(` ${colides.margin}┌${this.borderLength(maxes.maxcol+ maxes.maxrow + 3)}┐\n`);
    process.stdout.write(` ${colides.margin}│${this.strLength(col1, maxes.maxcol)}│${this.strLength(col2, maxes.maxrow)}│\n`);
  }
  static draw(col, value, maxes, borderless, width) {
    if (width == undefined) {
      width = process.stdout.columns;
    }
    let border = !borderless ? colides.border.vertical : colides.less;
    if (width - (maxes.maxcol + 19) <= value.length ) {
      value = value.slice(0, width - (maxes.maxcol + 22)) + '...';
    }
    process.stdout.write(` ${colides.margin}${border}${this.strLength(col, maxes.maxcol)}${border}${this.strLength(value, maxes.maxrow)}${border}\n`);
  }
  static drawLine(maxes, borderless, width) {
    if (width == undefined) {
      width = process.stdout.columns;
    }
    if (!borderless) process.stdout.write(` ${colides.margin}+${this.borderLength(maxes.maxcol)}+${this.borderLength(maxes.maxrow)}+\n`)
    else process.stdout.write(`\n`);
  }

  static getMax(obj, width) {
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
    if ((maxcol + maxrow + 8) > width) {
      maxrow = width - (maxcol + 19);
    }
    return {maxcol, maxrow};
  }

  static build(object, borderless, shifting, width) {
    if (borderless == undefined) {
      borderless = false;
    }
    let maxes = this.getMax(object, width);
    process.stdout.cursorTo(shifting);
    if (!borderless) {
      process.stdout.cursorTo(shifting);
      this.drawHead(maxes, 'Info', '', width);
    }
    this.drawLine(maxes, borderless, width);
    for(let key in object) {
      if (typeof object[key] !== 'object') {
        process.stdout.cursorTo(shifting);
        this.draw(key, object[key], maxes, borderless, width);
      }
    }
    process.stdout.cursorTo(shifting);
    this.drawLine(maxes, borderless, width);
  }
}
