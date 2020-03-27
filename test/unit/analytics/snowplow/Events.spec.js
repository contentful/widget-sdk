import _ from 'lodash';

describe('Events transformation', () => {
  beforeEach(async function () {
    this.system.set('analytics/transformers/Generic', {
      default: _.constant({ foo: 'bar' }),
    });

    this.Events = await this.system.import('analytics/transform');
  });

  it('#transformEvent()', function () {
    const transformed = this.Events.transformEvent('learn:language_selected', {});
    expect(transformed).toEqual({ foo: 'bar' });
  });

  it('#getSchemaForEvent()', function () {
    expect(this.Events.getSchemaForEvent('learn:language_selected').name).toBe('generic');
  });
});
