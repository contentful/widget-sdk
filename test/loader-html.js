module.exports = {
  locate: function (load) {
    // Assume that any HTML file will be loaded in a /src/javascripts file,
    // not /test.

    const fullPath = load.name;
    const [root, relativePath] = fullPath.split('/base');

    if (!relativePath.startsWith('/src/javascripts')) {
      return `${root}/base/src/javascripts${relativePath}`;
    } else {
      return fullPath;
    }
  },
  translate: function (load) {
    const html = load.source;

    if (this.builder) {
      load.metadata.format = 'cjs';
      return 'module.exports = ' + JSON.stringify(html);
    }
  },
  instantiate: function (load) {
    if (!this.builder) {
      return load.source;
    }
  },
};
