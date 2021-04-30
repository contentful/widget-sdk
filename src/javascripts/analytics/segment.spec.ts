import { noop } from 'lodash';
import { getSegmentSchemaForEvent } from './transform';
import { Schema } from './SchemasSegment';

let mockAnalytics;

jest.mock('utils/LazyLoader', () => ({
  get: jest.fn().mockImplementation(() => Promise.resolve(mockAnalytics)),
}));

const wait = noop;

const someEventName = 'element:click';

describe('Segment', () => {
  let segment;
  let track;

  beforeEach(() => {
    // Special import and treatment to reset globals/singleton:
    jest.resetModules();
    segment = require('./segment').default;

    track = jest.fn();
    window.analytics = {
      // @ts-expect-error
      push: noop,
    };
    mockAnalytics = {
      // Actual Segment lib mock.
      track,
    };
  });

  describe('#enable()', () => {
    it('enables tracking', async () => {
      segment.enable();
      segment.track(someEventName, { data: {} });
      await wait();
      expect(track).toHaveBeenCalledTimes(1);
    });

    it('tracks events tracked before .enable() was called', async () => {
      segment.track(someEventName, { data: {} });
      segment.enable();
      await wait();
      expect(track).toHaveBeenCalledTimes(1);
    });

    it('does not enable tracking if not called', async () => {
      segment.track(someEventName, { data: {} });
      await wait();
      expect(track).toHaveBeenCalledTimes(0);
    });
  });

  describe('#track()', () => {
    const data = { foo: 'bar' };

    beforeEach(() => {
      segment.enable();
    });

    describe('for events using `wrapPayloadInData: true` legacy option', () => {
      // Use arbitrary legacy event name from Snowplow -> Segment migration. Can be replaced with any other
      // event if this one gets removed in the future or if the `wrapPayloadInData` gets removed from it.
      const legacyEventName = 'entry:create';
      const schema = getSegmentSchemaForEvent('entry:create') as Schema;
      // Sanity check to ensure above event falls into the right category:
      expect(schema.wrapPayloadInData).toBe(true);

      it('tracks passed `data` as `{data}', () => {
        segment.track(legacyEventName, { data });
        expect(track).toHaveBeenCalledWith(schema.name, { data }, expect.any(Object));
      });

      it('it passes other props next to `data`', () => {
        const dataWithMoreProps = { data, more: 'data', contexts: { ...data } };
        segment.track(legacyEventName, { ...dataWithMoreProps });
        expect(track).toHaveBeenCalledWith(schema.name, dataWithMoreProps, expect.any(Object));
      });
    });

    it('tracks passed `data` directly for events not using `wrapPayloadInData` legacy option', () => {
      const nonLegacyEventName = 'reference_editor_action:create';
      const schema = getSegmentSchemaForEvent(nonLegacyEventName) as Schema;
      expect(schema.wrapPayloadInData).toBeFalsy();

      segment.track(nonLegacyEventName, { data });
      expect(track).toHaveBeenCalledWith(schema.name, data, expect.any(Object));
    });
  });
});
