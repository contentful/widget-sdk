const traverse = require('@babel/traverse').default;
const _ = require('lodash');

module.exports = function findServiceConsumer({ ast }) {
  const usages = [];

  function findWrapperName() {
    let name = 'ServicesConsumer';

    traverse(ast, {
      enter(path) {
        if (path.node.type === 'CallExpression') {
          const callee = path.get('callee');
          if (callee.type === 'Identifier' && callee.node.name === 'require') {
            const args = path.node.arguments;
            if (
              args.length === 1 &&
              args[0].value &&
              args[0].value.includes('reactServiceContext')
            ) {
              // export is default
              if (_.get(path, 'parentPath.node.property.name') === 'default') {
                // get variable name
                const foundName = _.get(path, 'parentPath.container.id.name');
                if (foundName) {
                  name = foundName;
                }
              }
            }
          }
        }
      }
    });

    return name;
  }

  function findWrapper(wrapperName) {
    traverse(ast, {
      enter(path) {
        if (path.node.type === 'CallExpression') {
          const callee = path.get('callee');
          if (callee.type === 'Identifier' && callee.node.name === wrapperName) {
            const args = path.node.arguments;
            args.forEach(arg => {
              if (arg.type === 'StringLiteral') {
                usages.push(arg.value + '.implicit');
              } else if (arg.type === 'ObjectExpression') {
                arg.properties.forEach(property => {
                  if (property.key.name === 'from') {
                    usages.push(property.value.value + '.implicit');
                  }
                });
              }
            });
          }
        }
      }
    });
  }

  const wrapperName = findWrapperName();

  if (wrapperName) {
    findWrapper(wrapperName);
  }

  return usages;
};
