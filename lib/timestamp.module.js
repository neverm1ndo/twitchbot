module.exports = class Timestamp {
  constructor(){}
  static stamp() {
    let timestamp = this.parse(Date.now());
    return `[${timestamp}]`;
  }
  static format(d) {
    let curr_date = d.getDate();
    let curr_month = d.getMonth() + 1;
    let curr_year = d.getFullYear();
    return `${curr_year}-${curr_month}-${curr_date}`;
  }
  static convert(str) {
    let pad = "00";
    return pad.substring(0, pad.length - str.length) + str;
  }
  static parse(time) {
    let date = new Date(time);
    let hours = date.getUTCHours().toString();
    let minutes = date.getMinutes().toString();
    let seconds = date.getSeconds().toString();
    return `${this.convert(hours)}:${this.convert(minutes)}:${this.convert(seconds)}`;
  }
}
