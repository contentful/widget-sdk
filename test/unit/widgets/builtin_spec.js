describe('widgets/builtin', () => {
  // This asserts that we can put the builtin widget ids into the
  // editing interface payload and it is validated by the CMA.
  // https://github.com/contentful/content_api/blob/master/lib/handler/constraints/management/schemas/content-type.js#L46-L51
  it('returns a valid resource ID for each widget descriptor', function () {
    module('contentful/test');
    this.create = this.$inject('widgets/builtin').create;
    this.create().forEach(({id}) => expectValidCmaId(id));
  });
});

function expectValidCmaId (id) {
  const ID_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
  expect(id).toMatch(ID_RE);
}
