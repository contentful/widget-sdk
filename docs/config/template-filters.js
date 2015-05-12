'use strict';

var _ = require('lodash-node');
var highlight = require('../lib/highlight');

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

    var types;
    if (fn.type && fn.type.type == 'FunctionType')
      types = functionTypeTypes(fn.type);
    else
      types = functionTagTypes(fn);

    var params = _.map(types.params, function (param) {
      var rendered = param.name;
      if (param.type)
        rendered += ': ' + param.type;
      return rendered;
    }).join(', ');
    rendered += '(' + params + ')';
    if (types.returns)
      rendered += ': '+ types.returns.type;
    return rendered;
  }
}, {
  name: 'memberSyntax',
  process: function (member, prefix) {
    if (member.docType == 'method')
      return methodMemberSyntax(member);

    var rendered = '';
    if (prefix)
      rendered += prefix + '.';

    rendered += member.name;
    if (member.typeExpression)
      rendered += ': ' + member.typeExpression;
    return rendered;
  }
}, {
  name: 'codeBlock',
  process: function (src, lang) {
    var codeString = highlight(src, lang);
    return '<code class="code-block hljs"><pre>' + codeString + '</pre></code>';
  }
}];

function functionTypeTypes (closureType) {
  var params = _.map(closureType.params, function (param) {
    var split = param.name.split(':');
    return {
      name: split[0],
      type: split[1]
    };
  });

  var returns;
  if (closureType.result)
    returns = {type: closureType.result.name};

  return {
    params: params,
    returns: returns
  };
}

function functionTagTypes (fn) {
  var params = _.map(fn.params, function (param) {
    return {
      name: param.name,
      type: param.typeExpression
    };
  });
  var returns = {};

  if (fn.returns && fn.returns.typeExpression)
    returns = {type: fn.returns.typeExpression};

  return {
    params: params,
    returns: returns
  };
}

/**
 * @param {string}        doc.name
 * @param {Array<Param>}  doc.params
 * @param {string}        doc.returns.description
 */
function methodMemberSyntax (doc) {
  var rendered = doc.name;

  var params = _.map(doc.params, function (param) {
    var rendered = param.name;
    if (param.type)
      rendered += ': ' + param.typeExpression;
    return rendered;
  }).join(', ');

  rendered += '(' + params + ')';
  if (doc.returns && doc.returns.typeExpression)
    rendered += ': '+ doc.returns.typeExpression;
  return rendered;
}
