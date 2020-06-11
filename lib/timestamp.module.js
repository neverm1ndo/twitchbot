module.exports = class Timestamp {
  static stamp() {
    const timestamp = this.parse(Date.now());
    return `[${timestamp}]`;
  }

  static format(d) {
    const current = {
      date: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
    return `${current.year}-${current.month}-${current.date}`;
  }

  static convert(str) {
    const pad = '00';
    return pad.substring(0, pad.length - str.length) + str;
  }

  static parse(time) {
    const date = new Date(time);
    const hours = date.getUTCHours().toString();
    const minutes = date.getMinutes().toString();
    const seconds = date.getSeconds().toString();
    return `${this.convert(hours)}:${this.convert(minutes)}:${this.convert(seconds)}`;
  }

  static parseCD(time) {
    const date = new Date(time);
    const minutes = date.getMinutes().toString();
    const seconds = date.getSeconds().toString();
    return `${this.convert(minutes)}:${this.convert(seconds)}`;
  }
};
