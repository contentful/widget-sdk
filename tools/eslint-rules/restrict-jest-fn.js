// in your rule
module.exports = {
  meta: {
    messages: {
      useSinon: "'jest.fn()' is used. Avoid using it and use 'sinon.stub()' instead."
    }
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.property && node.property.name === 'fn') {
          if (node.object && node.object.name === 'jest') {
            context.report({
              node,
              messageId: 'useSinon'
            });
          }
        }
      }
    };
  }
};
