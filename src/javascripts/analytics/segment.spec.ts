import { noop } from 'lodash';
import { getSegmentSchemaForEvent } from './transform';
import { Schema } from './SchemasSegment';
import { TransformedEventData } from './types';

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    segment = require('./segment').default;

    track = jest.fn();
    window.analytics = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
        expect(track).toHaveBeenCalledTimes(1);
      });

      it('it passes other props next to `data`', () => {
        const dataWithMoreProps = { data, more: 'data', contexts: { ...data } };
        segment.track(legacyEventName, { ...dataWithMoreProps });
        expect(track).toHaveBeenCalledWith(schema.name, dataWithMoreProps, expect.any(Object));
        expect(track).toHaveBeenCalledTimes(1);
      });
    });

    it('tracks passed `data` directly for events not using `wrapPayloadInData` legacy option', () => {
      const nonLegacyEventName = 'reference_editor_action:create';
      const schema = getSegmentSchemaForEvent(nonLegacyEventName) as Schema;
      expect(schema.wrapPayloadInData).toBeFalsy();

      segment.track(nonLegacyEventName, { data });
      expect(track).toHaveBeenCalledWith(schema.name, data, expect.any(Object));
      expect(track).toHaveBeenCalledTimes(1);
    });

    describe('Snowplow -> Segment new way of tracking experiment', () => {
      const NO_INTEGRACTIONS = { integrations: { All: false } };

      it('transformed data against Snowplow schema ID instead of internal web app event ID', () => {
        const eventData = {
          data: {
            action: 'open',
            organization_id: 'org-id',
            space_id: 'space-id',
            executing_user_id: 'user-id',
          },
          schema: 'snowplow-schema',
          contexts: {
            foo: 'bar',
          },
        } as TransformedEventData;
        const expectedPayload = {
          action: 'open',
          organization_key: 'org-id', // id -> key
          space_key: 'space-id', // id -> key
          // removed `executing_user_id`
          contexts: '{"foo":"bar"}', // serialized contexts JSON blob on main event data
        };
        const event = 'slide_in_editor:open';

        segment.track(event, eventData);
        expect(track).toHaveBeenCalledWith('slide_in_editor', expectedPayload, NO_INTEGRACTIONS);

        // We still track "the old way" as well as this is just an experiment for a few events:
        expect(track).toHaveBeenCalledTimes(2);
        expect(track).toHaveBeenCalledWith('slide_in_editor:open', eventData, expect.any(Object));
      });
    });
  });
});
