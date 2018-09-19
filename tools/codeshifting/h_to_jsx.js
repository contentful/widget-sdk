const { flow, includes, cond, constant, stubTrue, camelCase, identity } = require('lodash');
const { get, eq } = require('lodash/fp');

const mapArgumentKey = cond([[eq('xlink:href'), constant('xlinkHref')], [stubTrue, camelCase]]);

const hasType = check =>
  flow(
    get('type'),
    eq(check)
  );

function replaceHCall(j) {
  return node => {
    let attributes = [];
    if (node.type === 'Literal') {
      return j.jsxText(node.value);
    }
    if (node.type === 'TemplateLiteral') {
      return j.jsxExpressionContainer(node);
    }
    if (node.arguments.length > 1 && node.arguments[1].properties) {
      attributes = node.arguments[1].properties.map(
        ({ key: { name: keyName, value: keyValue }, value }) =>
          j.jsxAttribute(
            j.jsxIdentifier(mapArgumentKey(keyName || keyValue)),
            cond([
              [hasType('ObjectExpression'), j.jsxExpressionContainer],
              [hasType('Literal'), identity],
              [
                hasType('Identifier'),
                flow(
                  get('name'),
                  j.identifier,
                  j.jsxExpressionContainer
                )
              ]
            ])(value)
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
    const children =
      (node.arguments[1] && node.arguments[1].elements) ||
      (node.arguments[2] && node.arguments[2].elements) ||
      null;

    if (children) {
      return j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier(tagName), attributes),
        j.jsxClosingElement(j.jsxIdentifier(tagName)),
        children.map(replaceHCall(j))
      );
    }
    return j.jsxElement(j.jsxOpeningElement(j.jsxIdentifier(tagName), attributes, true));
  };
}

module.exports = function(fileInfo, { jscodeshift: j }) {
  const ast = j(fileInfo.source);
  let functionWrapper =
    ast.find(j.ArrowFunctionExpression).length === 1 || ast.find(j.FunctionExpression).length === 1;
  ast
    .find(j.CallExpression, { callee: { type: 'Identifier', name: 'h' } })
    .replaceWith(
      ({ node }) =>
        functionWrapper
          ? replaceHCall(j)(node)
          : j.arrowFunctionExpression([], replaceHCall(j)(node))
    );
  ast
    .find(j.ImportDeclaration, { specifiers: [{ imported: { name: 'h' } }] })
    .forEach(({ node }) => {
      node.specifiers = [j.importDefaultSpecifier(j.identifier('React'))];
      node.source.value = 'react';
    });
  return ast.toSource();
};
