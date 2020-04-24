#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');
const _ = require('lodash');
const { default: generate } = require('@babel/generator');
const { createBabelOptions } = require('../app-babel-options');
const { parseDOM } = require('htmlparser2');

const sourceDir = path.resolve(__dirname, '..', '..', 'src', 'javascripts');

// Read through the source directory, and determine the dependencies for each .js file
const usagesByFile = recursiveRead(sourceDir);

const usages = _(usagesByFile)
  .values()
  .flatten()
  .uniq()
  .remove((i) => !i.startsWith('@contentful/forma-36'))
  .valueOf();

console.log(usages.map(topLevelImportString).join('\n'));
console.log(`\n\n\n\n----------------\n\n\n\n`);
console.log(usages.map(allowedModulesString).join(',\n'));

function recursiveRead(p) {
  const usages = {};

  fs.readdirSync(p).forEach((name) => {
    const resolved = path.resolve(p, name);
    const isJsFile = resolved.endsWith('.js');
    const isSpecFile = isJsFile && resolved.endsWith('.spec.js');

    // Ignore .spec.js files
    if (isSpecFile) {
      return;
    }

    const stats = fs.statSync(resolved);

    if (stats.isFile() && isJsFile) {
      const names = processJsFile(resolved);
      usages[resolved] = names;
    } else if (stats.isDirectory()) {
      const dirUsages = recursiveRead(resolved);

      Object.assign(usages, dirUsages);
    }
  });

  return usages;
}

function processJsFile(filename) {
  // Look for either Hyperscript, or a string template.
  //
  // If it's Hyperscript, look through the AST for the first
  // argument being 'react-component'.
  //
  // If it's a string template, parse it as HTML and look for the react-component tag.
  //
  // In both, look for the `name` attribute.

  const names = [];
  const raw = fs.readFileSync(filename).toString();
  const babelOptions = createBabelOptions();

  let ast;

  try {
    ast = babel.parseSync(raw, babelOptions);
  } catch (e) {
    console.log(`Could not parse ${filename}`);
    console.log(e);

    return;
  }

  babel.traverse(ast, {
    enter: ({ node }) => {
      if (node.type === 'CallExpression') {
        // Handle the special "reactStateWrapper" case.
        const { callee, arguments: args } = node;

        if (callee.name === 'h') {
          if (args[0].type !== 'StringLiteral') {
            return;
          }

          if (args[0].value === 'react-component') {
            const { properties } = args[1];

            for (const prop of properties) {
              if (prop.key.name === 'name') {
                names.push(prop.value.value);
              }
            }
          }
        }

        const dynamicReactComponentUsageCalls = ['reactStateWrapper', 'conditionalIframeWrapper'];

        if (
          dynamicReactComponentUsageCalls.includes(callee.name) &&
          args[0].type === 'ObjectExpression'
        ) {
          const { properties } = args[0];

          for (const prop of properties) {
            if (prop.key && prop.key.name === 'componentPath') {
              names.push(prop.value.value);
            }
          }
        }

        if (callee.name === 'getReactTemplate') {
          if (args[0].type !== 'StringLiteral') {
            return;
          }

          names.push(args[0].value);
        }
      }

      if (node.type === 'StringLiteral' && node.value.match('<react-component')) {
        const name = getNameFromString(node.value, filename);

        if (!name) {
          return;
        }

        names.push(name);
      }

      if (node.type === 'TemplateLiteral') {
        const generatedString = generate(node).code.split('`')[1];

        if (generatedString.match('<react-component')) {
          const name = getNameFromString(generatedString, filename);

          if (!name) {
            return;
          }

          if (name.split('${').length > 1) {
            console.log(
              `Warning: ${filename} contains a react-component usage that is templatized with a variable component name. Find references to "${name}" manually.`
            );
          } else {
            names.push(name);
          }
        }
      }
    },
  });

  return names;
}

function getNameFromString(str, filename) {
  const parsed = parseDOM(str);

  return findName(parsed, str, filename);
}

function findName(dom, str, filename) {
  for (const ele of dom) {
    if (ele.type !== 'tag') {
      continue;
    }

    if (ele.name === 'react-component') {
      if (!ele.attribs.name) {
        console.log(
          `Warning: ${filename} contains react-component usage without name attribute. Double check it is okay. ${str}`
        );
        continue;
      }

      return ele.attribs.name;
    } else {
      const found = findName(ele.children, str);

      if (found) {
        return found;
      }
    }
  }
}

function topLevelImportString(filename) {
  const dependencyName = genDepName(filename);

  return `import * as ${dependencyName} from '${filename}';`;
}

function allowedModulesString(filename) {
  const dependencyName = genDepName(filename);

  return `'${filename}': ${dependencyName}`;
}

function genDepName(filename) {
  return _.camelCase(filename);
}
