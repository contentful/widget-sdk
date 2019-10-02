function findByRegexp(src, reg) {
  return reg.test(src);
}

module.exports = function findOtherByRegexp({ src }) {
  const usages = [];

  if (findByRegexp(src, /\b(react-component)\b/)) {
    usages.push('<react-component>');
  }

  if (findByRegexp(src, /\b(cf-context-menu-trigger)\b/)) {
    usages.push('cf-context-menu-trigger');
  }

  if (findByRegexp(src, /\b(cf-context-menu)\b/)) {
    usages.push('cf-context-menu');
  }

  if (findByRegexp(src, /\b(cf-component-bridge)\b/)) {
    usages.push('cf-component-bridge');
  }

  return usages;
};
