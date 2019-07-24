module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline styles in react files',
      category: 'Best Practices'
    }
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const nodeName = node.name.name;
        const nodeValueType = node.value
          ? node.value.expression
            ? node.value.expression.type
            : ''
          : '';
        if (nodeName === 'style') {
          if (nodeValueType === 'ObjectExpression') {
            context.report({
              node,
              message:
                'Inline styles are disallowed in react components. Please use emotion instead along with @contentful/forma-36-tokens.'
            });
            return;
          }
        }
      }
    };
  }
};
