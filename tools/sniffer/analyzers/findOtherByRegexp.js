function findByRegexp(src, reg) {
  return reg.test(src);
}

module.exports = function findOtherByRegexp({ src }) {
  const usages = [];

  if (findByRegexp(src, /\b(react-component)\b/)) {
    usages.push('<react-component>');
  }

  return usages;
};
