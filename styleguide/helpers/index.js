'use strict';

var _ = require('lodash-node');
var jade = require('jade');

module.exports.register = function(handlebars) {
  handlebars.registerHelper('jade', function (options) {
    var source = handlebars.helpers.markup.call(this, options);
    var template = jade.compile(source, {
      pretty: true
    });
    return template();
  });

  handlebars.registerHelper('pageTitle', function (options) {
    var mainSection = _.find(options.data.root.sections, {depth: 1});
    if (mainSection) {
      return mainSection.header;
    }
  });
};
