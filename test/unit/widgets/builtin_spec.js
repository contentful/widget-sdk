describe('widgets/builtin', function () {
  // This asserts that we can put the builtin widget ids into the
  // editing interface payload and it is validated by the CMA.
  // https://github.com/contentful/content_api/blob/master/lib/handler/constraints/management/schemas/content-type.js#L46-L51
  it('all ids are valid resource IDs', function () {
    module('contentful/test');
    Object.keys(this.$inject('widgets/builtin')).forEach(function (widgetId) {
      expect(widgetId).toMatch(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/);
    });
  });
});
