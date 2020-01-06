import _ from 'lodash';

describe('Snowplow events service', () => {
  beforeEach(async function() {
    this.system.set('analytics/snowplow/transformers/Generic', {
      default: _.constant({ foo: 'bar' })
    });

    this.Events = await this.system.import('analytics/snowplow/Events');
  });

  it('#transform()', function() {
    const transformed = this.Events.transform('learn:language_selected', {});
    expect(transformed).toEqual({ foo: 'bar' });
  });

  it('#getSchema()', function() {
    expect(this.Events.getSchema('learn:language_selected').name).toBe('generic');
  });
});