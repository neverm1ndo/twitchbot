module.exports = class RNG {
  contructor() {};
  randomize(min, max) {
    return Math.floor(Math.random()*max + min);
  };
}
