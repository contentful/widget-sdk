module.exports = function(fileInfo, { jscodeshift: j }) {
  const ast = j(fileInfo.source);

  const registerMethods = [
    'registerController',
    'registerDirective',
    'registerFilter',
    'registerFactory',
    'registerService',
    'registerConstant',
    'registerProvider',
    'registerValue'
  ];

  const nodes = [];

  // Find all registrations, copy them, and prune the original node
  ast.find(j.ExpressionStatement, { expression: { type: 'CallExpression' } }).forEach(path => {
    const {
      expression: {
        callee: { name }
      }
    } = path.value;

    if (registerMethods.includes(name)) {
      nodes.push(path.value);

      path.prune();
    }
  });

  if (nodes.length === 0) {
    return;
  }

  // Construct a default export node called register
  const exportNode = j.exportDefaultDeclaration(
    j.functionExpression(j.identifier('register'), [], j.blockStatement(nodes))
  );

  // Append export to body
  ast.get().node.program.body.push(exportNode);

  // Write new source
  return ast.toSource({ quote: 'single' });
};
