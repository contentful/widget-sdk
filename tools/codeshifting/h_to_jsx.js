function replaceHCall(j) {
  return node => {
    let attributes = [];
    if (node.arguments.length > 1) {
      attributes = node.arguments[1].properties.map(({ key: { name }, value: { value } }) =>
        j.jsxAttribute(j.jsxIdentifier(name), j.literal(value))
      );
    }
    if (node.arguments.length < 3) {
      return j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier(node.arguments[0].value), attributes, true)
      );
    }
    return j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(node.arguments[0].value), attributes),
      j.jsxClosingElement(j.jsxIdentifier(node.arguments[0].value)),
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
