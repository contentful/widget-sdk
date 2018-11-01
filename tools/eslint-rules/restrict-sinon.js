// in your rule
module.exports = {
  meta: {
    messages: {
      useJest: "'sinon.{{fn}}' is used. Use jest features instead of sinon.",
      useJestSpy: "'sinon.{{fn}}' is used. Avoid using it and use 'jest.fn()' instead.",
      useJestMatchers:
        "'sinon.assert.{{fn}}' is used. Avoid using it and use jest matchers, for example 'expect(spy.{{fn}}).toBe(...)'"
    }
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object && node.object.name === 'sinon') {
          if (node.property && node.property.name === 'assert') {
            context.report({
              node,
              messageId: 'useJestMatchers',
              data: {
                fn: node.parent.property.name
              }
            });
            return;
          }
          if (node.property && (node.property.name === 'stub' || node.property.name === 'spy')) {
            context.report({
              node,
              messageId: 'useJestSpy',
              data: {
                fn: node.property.name
              }
            });
            return;
          }
          context.report({
            node,
            messageId: 'useJest',
            data: {
              fn: node.property ? node.property.name : ''
            }
          });
        }
      }
    };
  }
};
