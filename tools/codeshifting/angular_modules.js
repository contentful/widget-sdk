const { capitalize, last, uniq, negate } = require('lodash');
const { endsWith } = require('lodash/fp');

module.exports = function(fileInfo, { jscodeshift: j }) {
  const ast = j(fileInfo.source);

  const registerHelpersNeeded = [];
  const importsNeeded = [];
  const isImportable = path => ['lodash'].includes(path) || endsWith('.es6', path);
  const toBoundName = path => last(path.replace('.es6', '').split('/'));

  let hasAngularDefinitions = false;

  ast
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'angular'
              },
              property: {
                type: 'Identifier',
                name: 'module'
              }
            },
            arguments: [{ value: 'contentful' }]
          }
        }
      }
    })
    .replaceWith(path => {
      hasAngularDefinitions = true;
      const {
        expression: {
          callee: {
            property: { name: type }
          },
          arguments: [{ value: name }, definition]
        }
      } = path.node;
      const registerHelper = `register${capitalize(type)}`;
      registerHelpersNeeded.push(registerHelper);
      if (type === 'factory' && definition.type === 'ArrayExpression') {
        const requiredModules = [];
        const functionDef = last(definition.elements);
        j(functionDef.body)
          .find(j.CallExpression, { callee: { name: 'require' } })
          .replaceWith(({ node: { arguments: [{ value: path }] } }) => {
            const boundName = toBoundName(path);
            requiredModules.push(path);
            return j.identifier(boundName);
          });
        functionDef.params = uniq(requiredModules)
          .filter(negate(isImportable))
          .map(toBoundName)
          .map(j.identifier);
        definition.elements = [
          ...uniq(requiredModules)
            .filter(negate(isImportable))
            .map(j.literal),
          functionDef
        ];
        importsNeeded.push(...uniq(requiredModules).filter(isImportable));
      }
      return j.expressionStatement(
        j.callExpression(j.identifier(registerHelper), [j.literal(name), definition])
      );
    });
  if (!hasAngularDefinitions) {
    return fileInfo.source;
  }

  ast.find(j.ExpressionStatement, { expression: { value: 'use strict' } }).remove();
  ast
    .get()
    .node.program.body.unshift(
      `import { ${uniq(registerHelpersNeeded).join(', ')} } from 'NgRegistry.es6';`
    );
  uniq(importsNeeded).forEach(path =>
    ast.get().node.program.body.unshift(`import * as ${toBoundName(path)} from '${path}';`)
  );

  ast.find(j.Property).forEach(({ node }) => {
    const {
      key: { name: key },
      value: { name: value }
    } = node;
    if (key === value) {
      node.shorthand = true;
    }
  });

  ast
    .find(j.VariableDeclaration)
    .filter(
      ({
        node: {
          declarations: [
            {
              id: { name: id },
              init: { name: init }
            }
          ]
        }
      }) => id === init
    )
    .remove();

  // return fileInfo.source;
  return ast.toSource({ quote: 'single' });
};
