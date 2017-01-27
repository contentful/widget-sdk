describe('Snowplow Transformers service', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('analytics/snowplow/transformers/Generic', 'foo');
    });
    this.Transformers = this.$inject('analytics/snowplow/Transformers');
  });

  it('getTransformer() returns transformer()', function () {
    expect(this.Transformers.getTransformer('generic')).toBe('foo');
  });
});
