'use strict';

var jade = require('jade');

module.exports.register = function(handlebars) {
  handlebars.registerHelper('jade', function (options) {
    var source = handlebars.helpers.markup.call(this, options);
    var template = jade.compile(source, {
      pretty: true
    });
    return template();
  });
};
