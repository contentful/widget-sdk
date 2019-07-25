module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow forma css classes in react files',
      category: 'Best Practices'
    }
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const nodeName = node.name.name;
        const nodeValue = node.value ? node.value.value : '';
        const f36ClassRegex = /\bf36-\b/;

        // nodeValue can be undefined hence the (nodeValue || '')
        if (nodeName === 'className' && (nodeValue || '').search(f36ClassRegex) > -1) {
          context.report({
            node,
            message:
              'Classes for forma css are disallowed in react components. Please use emotion with @contentful/forma-36-tokens.'
          });
        }
      }
    };
  }
};
