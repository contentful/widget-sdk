const { includes } = require('lodash');

function replaceHCall(j) {
  return node => {
    let attributes = [];
    if (node.arguments.length > 1 && node.arguments[1].properties) {
      attributes = node.arguments[1].properties.map(
        ({ key: { name: keyName, value: keyValue }, value: { value } }) =>
          j.jsxAttribute(
            j.jsxIdentifier(keyName || keyValue),
            value ? j.literal(value) : j.jsxExpressionContainer(j.identifier(keyName))
          )
      );
    }
    const hArgument = node.arguments[0].value;
    let tagName = hArgument;
    if (includes(hArgument, '#')) {
      attributes.push(j.jsxAttribute(j.jsxIdentifier('id'), j.literal(hArgument.split('#')[1])));
      tagName = hArgument.split('#')[0] || 'div';
    }
    if (includes(hArgument, '.')) {
      tagName = hArgument.split('.')[0] || 'div';
      attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier('className'),
          j.literal(
            hArgument
              .split('.')
              .slice(1)
              .join(' ')
          )
        )
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
  let hasArguments = ast.find(j.ArrowFunctionExpression).length === 1;
  ast
    .find(j.CallExpression, { callee: { type: 'Identifier', name: 'h' } })
    .replaceWith(
      ({ node }) =>
        hasArguments ? replaceHCall(j)(node) : j.arrowFunctionExpression([], replaceHCall(j)(node))
    );
  ast
    .find(j.ImportDeclaration, { specifiers: [{ imported: { name: 'h' } }] })
    .forEach(({ node }) => {
      node.specifiers = [j.importDefaultSpecifier(j.identifier('React'))];
      node.source.value = 'react';
    });
  return ast.toSource();
};
