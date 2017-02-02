describe('Snowplow events service', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('analytics/snowplow/transformers/Generic', _.constant({foo: 'bar'}));
    });
    this.Events = this.$inject('analytics/snowplow/Events');
  });

  it('#transform()', function () {
    const transformed = this.Events.transform('learn:language_selected', {});
    expect(transformed).toEqual({foo: 'bar'});
  });

  it('#getSchema()', function () {
    expect(this.Events.getSchema('learn:language_selected').name).toBe('generic');
  });
});
