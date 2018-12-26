const moduleVisitor = require('eslint-module-utils/moduleVisitor');

const resolve = require('eslint-module-utils/resolve');
const ImportType = require('eslint-plugin-import/lib/core/importType');
// const path = require('path');

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

      if (depPath.split('..').length > 2) {
        const absDepPath = resolve.default(depPath, context);
        let additionalMessage = '';

        try {
          const suggestedImport = absDepPath.split('src/javascripts/')[1].replace('.js', '');
          additionalMessage = `Import \`${suggestedImport}\` instead of \`${depPath}\` or move file closer in the folder tree.`;
        } catch (e) {
          additionalMessage =
            'Make the import absolute or move the file closer in the folder tree.';
        }

        context.report({
          node: sourceNode,
          message: `Deep parent relative imports are not allowed. ${additionalMessage}`
        });
      }
    }

    return moduleVisitor.default(checkSourceValue, context.options[0]);
  }
};
