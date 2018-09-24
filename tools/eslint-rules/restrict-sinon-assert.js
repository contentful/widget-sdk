// in your rule
module.exports = {
  meta: {
    messages: {
      useJestMatchers:
        "'sinon.assert.{{fn}}' is used. Avoid using it and use jest matchers, for example 'expect(spy.{{fn}}).toBe(...)'"
    }
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.property && node.property.name === 'assert') {
          if (node.object && node.object.name === 'sinon') {
            const fn = node.parent.property.name;
            context.report({
              node,
              messageId: 'useJestMatchers',
              data: {
                fn
              }
            });
          }
        }
      }
    };
  }
};
