const traverse = require('@babel/traverse').default;

function isAngularCallee(node) {
  const object = node.get('object');
  const property = node.get('property');
  if (
    object &&
    object.node.name === 'angular' &&
    object.type === 'Identifier' &&
    property.type === 'Identifier'
  ) {
    return property.node.name;
  }
  return false;
}

module.exports = function findAngular({ ast }) {
  const usages = [];

  traverse(ast, {
    enter(path) {
      if (path.node.type === 'CallExpression') {
        const callee = path.get('callee');
        if (callee.type === 'MemberExpression') {
          const angular = isAngularCallee(callee);
          if (angular) {
            const usage = `angular.${angular}`;
            usages.push(usage);
          }
        }
      }
    }
  });

  return usages;
};
