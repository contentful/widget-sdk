const _ = require('lodash');
const fs = require('fs');
const babel = require('@babel/core');
const { createBabelOptions } = require('../../app-babel-options');
const createWebpackConfig = require('../../webpack.config');

process.on('message', data => {
  if (data.files) {
    const { files } = data;

    // The runner has no more files for this worker. Exit normally
    if (files.length === 0) {
      process.exit(0);
    }

    const raw = files.map(determineDependencies);

    process.send(_.flatten(raw));
  } else {
    // Worker received invalid data, exit with non-0 status code
    process.exit(1);
  }
});

function determineDependencies(p) {
  const raw = fs.readFileSync(p).toString();
  const babelOptions = createBabelOptions();

  let ast;

  try {
    ast = babel.parseSync(raw, babelOptions);
  } catch (e) {
    console.log(`Could not parse ${p}`);
    console.log(e);

    return;
  }

  const imports = [];

  babel.traverse(ast, {
    enter: ({ node, parent }) => {
      let value;

      if (node.type === 'ImportDeclaration') {
        value = node.source.value;
      } else if (node.type === 'Import') {
        if (parent.arguments.length !== 1) {
          return;
        }

        value = parent.arguments[0].value;
      } else {
        return;
      }

      if (isExternalImport(value)) {
        imports.push(value);
      }
    }
  });

  return imports;
}

function isExternalImport(importName) {
  try {
    require.resolve(importName);

    return true;
  } catch (e) {
    // pass
  }

  // If it wasn't resolved via `require`, then we also check if it is aliased in Webpack
  const conf = createWebpackConfig();

  if (conf.resolve && conf.resolve.alias[importName]) {
    return true;
  }

  return false;
}
