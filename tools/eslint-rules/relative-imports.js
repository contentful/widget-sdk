const moduleVisitor = require('eslint-module-utils/moduleVisitor');

const resolve = require('eslint-module-utils/resolve');
const ImportType = require('eslint-plugin-import/lib/core/importType');
const path = require('path');

module.exports = {
  meta: {},
  create(context) {
    const myPath = context.getFilename();
    if (myPath === '<text>') return {}; // can't check a non-file

    function checkSourceValue(sourceNode) {
      const depPath = sourceNode.value;

      if (ImportType.default(depPath, context) === 'external') {
        // ignore packages
        return;
      }

      const absDepPath = resolve.default(depPath, context);

      if (!absDepPath) {
        if (depPath.includes('./') || depPath.includes('../')) {
          context.report({
            node: sourceNode,
            message: `Counldn't resolve '${depPath}'`
          });
        }
        // unable to resolve path
        return;
      }

      const relDepPath = path.relative(path.dirname(myPath), absDepPath);

      if (ImportType.default(relDepPath, context) === 'parent' && relDepPath.includes('../..')) {
        let suggestedImport = '';
        try {
          suggestedImport = absDepPath.split('src/javascripts/')[1].replace('.js', '');
        } catch (e) {
          //
        }

        context.report({
          node: sourceNode,
          message:
            'Deep parent relative imports are not allowed. ' +
            `Please import \`${suggestedImport}\` instead of \`${relDepPath}\` or move file closer in the folder tree.`
        });
      }
    }

    return moduleVisitor.default(checkSourceValue, context.options[0]);
  }
};
