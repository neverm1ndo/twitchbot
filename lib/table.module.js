const colides = {
  corner: '+',
  border: {
    vertical: '│',
    horizontal: '─',
  },
  margin: '     ',
  less: ' ',
};
module.exports = class Table {
  static strLength(str, max) {
    let resstr = str.toString();
    const length = max - str.length;
    for (let i = 0; i < length; i += 1) {
      resstr += ' ';
    }
    return ` ${resstr} `;
  }

  static borderLength(length) {
    let line = '';
    for (let i = 0; i <= length + 2; i += 1) {
      if ((i !== length)) {
        line += colides.border.horizontal;
      }
    }
    return line;
  }

  static drawHead(maxes, col1, col2) {
    process.stdout.write(` ${colides.margin}┌${this.borderLength(maxes.maxcol + maxes.maxrow + 3)}┐\n`);
    process.stdout.write(` ${colides.margin}│${this.strLength(col1, maxes.maxcol)}│${this.strLength(col2, maxes.maxrow)}│\n`);
  }

  static draw(c, v, m, b) {
    const props = {
      col: c, value: v, maxes: m, borderless: b,
    };
    const border = !props.borderless ? colides.border.vertical : colides.less;
    if (process.stdout.columns - (props.maxes.maxcol + 19) <= props.value.length) {
      props.value = `${props.value.slice(0, process.stdout.columns - (props.maxes.maxcol + 22))}...`;
    }
    process.stdout.write(` ${colides.margin}${border}${this.strLength(props.col, props.maxes.maxcol)}${border}${this.strLength(props.value, props.maxes.maxrow)}${border}\n`);
  }

  static drawLine(maxes, borderless) {
    if (!borderless) process.stdout.write(` ${colides.margin}+${this.borderLength(maxes.maxcol)}+${this.borderLength(maxes.maxrow)}+\n`);
    else process.stdout.write('\n');
  }

  static getMax(obj) {
    let maxcol = 0;
    let maxrow = 0;

    Object.keys(obj).forEach((key) => {
      if (key.length > maxcol) {
        maxcol = key.length;
      }
      if (obj[key] !== null) {
        if (obj[key].length > maxrow) {
          maxrow = obj[key].toString().length;
        }
      } else {
        const resobj = obj;
        resobj[key] = `No ${key}`;
        maxrow = resobj[key].length;
      }
    });
    if ((maxcol + maxrow + 8) > process.stdout.columns) {
      maxrow = process.stdout.columns - (maxcol + 19);
    }
    return { maxcol, maxrow };
  }

  static build(object, borderless) {
    let border = borderless;
    if (border === undefined) {
      border = false;
    }
    const maxes = this.getMax(object);
    if (!border) this.drawHead(maxes, 'Info', '');
    this.drawLine(maxes, borderless);
    Object.keys(object).forEach((key) => {
      if (typeof object[key] !== 'object') {
        this.draw(key, object[key], maxes, borderless);
      }
    });
    this.drawLine(maxes, borderless);
  }
};
