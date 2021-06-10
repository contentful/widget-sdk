import { noop } from 'lodash';
import { getSegmentSchemaForEvent } from './transform';
import { TransformedEventData, SegmentSchema as Schema } from './types';
import { transformSnowplowToSegmentData } from './segment';

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

  // Arbitrary event, replaced with another one if this gets removed or moved to typewriter tracking.
  const event = 'entry:create';
  const eventSchema = getSegmentSchemaForEvent(event) as Schema;
  // Sanity check to ensure above event isn't a generic one:
  expect(eventSchema.isLegacySnowplowGeneric).toBe(false);

  describe('#track()', () => {
    const data = { foo: 'bar' };

    beforeEach(() => {
      segment.enable();
    });

    it('tracks data against event schema with passed payload', () => {
      segment.track(event, { payload: data });
      expect(track).toHaveBeenCalledWith(eventSchema.name, data, expect.any(Object));
      expect(track).toHaveBeenCalledTimes(1);
    });
  });

  describe('transformSnowplowToSegmentData()', () => {
    const simpleData: TransformedEventData = { data: { foo: 'bar' } };
    const complexData: TransformedEventData = {
      schema: 'iglu:com.contentful/foo-schema.json',
      data: {
        foo: 'bar',
        nested: { foo: { bar: 'baz' } },
        items: ['one', 'two'],
        space_id: 'space-id-1',
        organization_id: 'org-id-1',
        executing_user_id: 'user-id-1',
      },
      contexts: [simpleData],
    };
    // Not a valid TransformedEventData as props aren't inside `data` but on the root level:
    const nonsenseData = { foo: 'bar', data: { space_id: 'space-id-2' } };

    describe('for normal events', () => {
      it('returns `data` as `{payload: data}` and does not add env id as there is no space id', () => {
        const result = transformSnowplowToSegmentData(event, simpleData, 'env-id-1');
        expect(result).toStrictEqual({ payload: { ...simpleData.data } });
      });

      it('transforms passed `data`', () => {
        const result = transformSnowplowToSegmentData(event, complexData, 'env-id-1');
        expect(result).toStrictEqual({
          payload: {
            foo: 'bar',
            nested: '{"foo":{"bar":"baz"}}', // stringify objects
            items: ['one', 'two'], // do not stringify arrays
            space_key: 'space-id-1', // _id to _key
            organization_key: 'org-id-1', // _id to _key
            environment_key: 'env-id-1', // added because there's a space_key
            contexts: '[{"data":{"foo":"bar"}}]', // stringified contexts
            // Removes `executing_user_id` as it's redundant with Semgent's `user_id` which is automatically added.
            // Does not include `schema` as it's Snowplow specific.
          },
        });
      });

      it('preserves invalid transformed data incorrectly added to the object root', () => {
        const result = transformSnowplowToSegmentData(event, nonsenseData, 'env-id-2');
        expect(result).toEqual({
          payload: { foo: 'bar', space_key: 'space-id-2', environment_key: 'env-id-2' },
        });
      });
    });

    describe('for `generic` Snowplow events', () => {
      // Arbitrary generic event, replaced with another one if this gets removed or moved to typewriter tracking.
      const genericEvent = 'entity_button:click';
      const genericEventSchema = getSegmentSchemaForEvent(genericEvent) as Schema;
      // Sanity check to ensure above event is a generic one:
      expect(genericEventSchema.isLegacySnowplowGeneric).toBe(true);

      it('returns passed `data` as `{payload: {data} } without environment ID', () => {
        const result = transformSnowplowToSegmentData(genericEvent, simpleData, 'env-id-1');
        expect(result).toStrictEqual({ payload: simpleData });
      });

      it('does no transformation on the data as for non-generic events', () => {
        const result = transformSnowplowToSegmentData(genericEvent, complexData, 'env-id-1');
        expect(result).toStrictEqual({ payload: complexData });
      });
    });
  });
});
