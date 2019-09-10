module.exports = class Timestamp {
  constructor(){}
  static stamp() {
    let timestamp = this.parse(Date.now(), 0);
    return `[${timestamp}]`;
  }
  static convert(str) {
    let pad = "00";
    return pad.substring(0, pad.length - str.length) + str;
  }
  static parse(time, gmt) {
    let date = new Date(time);
    let hours = (date.getHours() - gmt).toString();
    let minutes = date.getMinutes().toString();
    let seconds = date.getSeconds().toString();
    return `${this.convert(hours)}:${this.convert(minutes)}:${this.convert(seconds)}`;
  }
}
