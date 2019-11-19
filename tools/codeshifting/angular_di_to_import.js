const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { builders } = require('ast-types');

const regUtils = [
  'registerController',
  'registerDirective',
  'registerFilter',
  'registerFactory',
  'registerService',
  'registerConstant',
  'registerProvider',
  'registerValue'
];

module.exports = function(fileInfo, { jscodeshift: j }) {
  const absPath = path.resolve(fileInfo.path);
  const modulesPath = `${absPath.split('/src/javascripts')[0]}/src/javascripts`;

  const ast = j(fileInfo.source);

  const imports = {};

  ast.find(j.CallExpression).map(node => {
    const {
      value: { callee }
    } = node;

    let result = null;

    if (regUtils.includes(callee.name)) {
      result = handleDi(modulesPath, node);
    } else if (callee.name === 'getModule') {
      result = handleGetModule(modulesPath, node);
    }

    if (result) {
      result.imports.forEach(([foundDep, importDefs]) => {
        if (!imports[foundDep]) {
          imports[foundDep] = [];
        }

        importDefs.forEach(def => imports[foundDep].push(def));
      });

      return result.node;
    } else {
      return node;
    }
  });

  // Remove getModule import if it isn't used
  const usesGetModule =
    ast.find(j.CallExpression).filter(node => {
      return node.value.callee.name === 'getModule';
    }).length > 0;

  if (!usesGetModule) {
    // Remove reference to getModule import if it exists
    ast.find(j.ImportDeclaration).forEach(node => {
      const {
        value: { source, specifiers }
      } = node;

      if (source.value === 'NgRegistry') {
        const getModuleSpecifier = specifiers.find(
          specifier => specifier.imported.name === 'getModule'
        );

        if (getModuleSpecifier) {
          if (specifiers.length === 1) {
            node.prune();
          } else {
            getModuleSpecifier.prune();
          }
        }
      }
    });
  }

  const lastImport = ast
    .find(j.ImportDeclaration)
    .paths()
    .slice(-1)[0];

  Object.entries(imports).forEach(([imp, rawValues]) => {
    // const pos = i + j + 1;
    const specifiers = [];

    // There can only be one * import value
    const allImportValue = rawValues.find(({ type }) => type === 'all');

    if (allImportValue) {
      const id = builders.identifier(allImportValue.value);
      const namespaceSpecifier = builders.importNamespaceSpecifier(id);

      specifiers.push(namespaceSpecifier);
    } else {
      rawValues
        .filter(({ type }) => type === 'property')
        .forEach(({ value, castValue }) => {
          let specifier;

          if (!castValue) {
            const id = builders.identifier(value);

            specifier = builders.importSpecifier(id);
          } else {
            const id = builders.identifier(value);
            const castId = builders.identifier(castValue);
            specifier = builders.importSpecifier(id, castId);
          }

          specifiers.push(specifier);
        });
      const directValue = rawValues.find(({ type }) => type === 'direct');

      if (directValue) {
        const id = builders.identifier(directValue.value);
        const defaultSpecifier = builders.importDefaultSpecifier(id);

        specifiers.push(defaultSpecifier);
      }
    }

    if (specifiers.length === 0) {
      return;
    }

    const impLiteral = builders.literal(imp);
    const importDeclaration = builders.importDeclaration(specifiers, impLiteral, 'value');

    if (lastImport) {
      lastImport.insertAfter(importDeclaration);
    } else {
      const body = ast.get().node.program.body;

      body.splice(0, 0, importDeclaration);
    }
  });

  return ast.toSource({ quote: 'single' });
};

function handleDi(modulesPath, node) {
  const {
    value: { arguments: args }
  } = node;

  const paramsToRemove = [];
  const imports = [];

  // Ignore all registrations that are not using an array DI
  if (args[1].type !== 'ArrayExpression') {
    return { imports, node };
  }

  const dependencies = args[1].elements.slice(0, -1);
  const definition = args[1].elements.slice(-1)[0];

  dependencies.forEach((dep, i) => {
    // For each dependency, attempt to resolve it in the filesystem
    //
    // If it can be resolved, remove it from the DI and add it to the imports
    const depName = dep.value;
    const foundDep = findDependencyInSrc(modulesPath, depName);

    // If neither the raw dependency nor the dependency with index.es6 appended is found,
    // quit early
    if (!foundDep) {
      return;
    }

    paramsToRemove.push(i);

    const param = definition.params[i];

    imports.push([foundDep, generateImportDefinition(param)]);
  });

  paramsToRemove.forEach((i, j) => {
    args[1].elements.splice(i - j, 1);
    definition.params.splice(i - j, 1);
  });

  return { imports, node };
}

function handleGetModule(modulesPath, node) {
  const {
    value: { arguments: args }
  } = node;

  let imp = null;

  const depName = args[0].value;
  const foundDep = findDependencyInSrc(modulesPath, depName);

  if (!foundDep) {
    return { imports: [], node };
  }

  const param = node.parentPath.value.id;

  imp = [foundDep, generateImportDefinition(param)];

  node.parentPath.prune();

  return { imports: [imp], node };
}

function generateImportDefinition(param) {
  if (param.type === 'Identifier') {
    return [
      {
        type: 'all',
        value: param.name
      }
    ];
  } else if (param.type === 'ObjectPattern') {
    if (param.properties.length === 1 && param.properties[0].key.name === 'default') {
      return [
        {
          type: 'direct',
          value: param.properties[0].value.name
        }
      ];
    } else {
      return param.properties.map(prop => {
        if (prop.key.name === prop.value.name) {
          return {
            type: 'property',
            value: prop.key.name
          };
        } else {
          return {
            type: 'property',
            value: prop.key.name,
            castValue: prop.value.name
          };
        }
      });
    }
  } else {
    throw new Error(`Param type not supported: ${param.type}`);
  }
}

function findDependencyInSrc(modulesPath, depName) {
  // Attempt to resolve it in the filesystem
  //
  // If it can be resolved, return the resolved depName as it would be used for importing
  const depPath = path.join(modulesPath, `${depName}.js`);

  // Also attempt to find the dependency with /index.es6.js appended
  const depWithIndexPath = path.join(modulesPath, `${depName}/index.es6.js`);

  // Ignore if path cannot be resolved
  if (fs.existsSync(depPath)) {
    return depName;
  } else if (fs.existsSync(depWithIndexPath)) {
    return `${depName}/index.es6`;
  }

  return null;
}
