module.exports = class RNG {
  contructor() {};
  static randomize(min, max) {
    return Math.floor(Math.random()*max + min);
  };
}
