module.exports = class RNG {
  static randomize(min, max) {
    return Math.floor(Math.random() * max + min);
  }
};
