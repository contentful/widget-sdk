var jade = require('jade');

module.exports.register = function(handlebars) {
  handlebars.registerHelper('jade', function(source) {
    var template = jade.compile(source, {
      pretty: true
    });
    return template();
  });
};
