'use strict';

const _ = require('lodash');
const Components = require('eslint-plugin-react/lib/util/Components');

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'Prevent multiple component exports per file',
      category: 'Stylistic Issues',
    },
  },

  create: Components.detect((context, components) => {
    const MULTI_COMP_MESSAGE = 'Export only one React component per file';

    /**
     * Checks if the component is ignored
     * @param {Object} component The component being checked.
     * @returns {Boolean} True if the component is ignored, false if not.
     */
    function isIgnored(component) {
      // ignore non-exported files
      return _.get(component, 'node.parent.type') !== 'ExportNamedDeclaration';
    }

    // --------------------------------------------------------------------------
    // Public
    // --------------------------------------------------------------------------

    return {
      'Program:exit'() {
        if (components.length() <= 1) {
          return;
        }

        const list = components.list();

        Object.keys(list)
          .filter((component) => !isIgnored(list[component]))
          .forEach((component, i) => {
            if (i >= 1) {
              context.report({
                node: list[component].node,
                message: MULTI_COMP_MESSAGE,
              });
            }
          });
      },
    };
  }),
};
