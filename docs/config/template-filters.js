'use strict';

var _ = require('lodash-node');

/**
 * Filters for nunjucks templates.
 *
 * ## `functionSyntax`
 * Builds a function expression from an object
 *
 * ~~~js
 * functionSyntax({
 *   name: 'fn',
 *   params: [{name: 'arg', typeExpression: 'string'}],
 *   returns: {typeExpression: 'boolean'}
 * }) // => fn(arg: string): boolean
 * ~~~
 */
module.exports = [{
  name: 'functionSyntax',
  process: function (fn, prefix) {
    // TODO types
    var rendered;
    if (prefix)
      rendered = prefix + '.';
    else
      rendered = '';

    rendered += fn.name;

    var params = _.map(fn.params, function (param) {
      var rendered = param.name;
      if (param.typeExpression)
        rendered += ': ' + param.typeExpression;
      return rendered;
    }).join(', ');
    rendered += '(' + params + ')';
    if (fn.returns && fn.returns.typeExpression)
      rendered += ': '+ fn.returns.typeExpression;
    return rendered;
  }
}];
