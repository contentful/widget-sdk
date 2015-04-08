var jade = require('jade');

module.exports.register = function(handlebars) {
  handlebars.registerHelper('jade', function() {
    var source = handlebars.helpers.markup.call(this);
    var template = jade.compile(source, {
      pretty: true
    });
    return template();
  });
};
