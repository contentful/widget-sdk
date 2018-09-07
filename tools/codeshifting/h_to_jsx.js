const { includes, startsWith } = require('lodash');

function replaceHCall(j) {
  return node => {
    let attributes = [];
    if (node.arguments.length > 1 && node.arguments[1].properties) {
      attributes = node.arguments[1].properties.map(({ key: { name }, value: { value } }) =>
        j.jsxAttribute(j.jsxIdentifier(name), j.literal(value))
      );
    }
    const hArgument = node.arguments[0].value;
    let tagName = hArgument;
    if (includes(tagName, '.')) {
      const classNames = hArgument.split('.').slice(1);
      if (startsWith(hArgument, '.')) {
        tagName = 'div';
      } else {
        tagName = hArgument.split('.')[0];
      }
      attributes.push(
        j.jsxAttribute(j.jsxIdentifier('className'), j.literal(classNames.join(' ')))
      );
    }
    if (node.arguments.length < 3 || !node.arguments[2].elements) {
      return j.jsxElement(j.jsxOpeningElement(j.jsxIdentifier(tagName), attributes, true));
    }
    return j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(tagName), attributes),
      j.jsxClosingElement(j.jsxIdentifier(tagName)),
      node.arguments[2].elements.map(replaceHCall(j))
    );
  };
}

module.exports = function(fileInfo, { jscodeshift: j }) {
  const ast = j(fileInfo.source);
  ast
    .find(j.CallExpression, { callee: { type: 'Identifier', name: 'h' } })
    .replaceWith(({ node }) => j.arrowFunctionExpression([], replaceHCall(j)(node)));
  ast
    .find(j.ImportDeclaration, { specifiers: [{ imported: { name: 'h' } }] })
    .forEach(({ node }) => {
      node.specifiers = [j.importDefaultSpecifier(j.identifier('React'))];
      node.source.value = 'react';
    });
  return ast.toSource();
};
