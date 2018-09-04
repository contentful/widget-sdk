describe('Snowplow events service', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('analytics/snowplow/transformers/Generic.es6', _.constant({ foo: 'bar' }));
    });
    this.Events = this.$inject('analytics/snowplow/Events.es6');
  });

  it('#transform()', function() {
    const transformed = this.Events.transform('learn:language_selected', {});
    expect(transformed).toEqual({ foo: 'bar' });
  });

  it('#getSchema()', function() {
    expect(this.Events.getSchema('learn:language_selected').name).toBe('generic');
  });
});
