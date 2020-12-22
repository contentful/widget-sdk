import transformer from './EntryActionV2';
import EntityActionStub from './EntityAction';
import { when } from 'jest-when';

jest.mock('./EntityAction', () => jest.fn());

describe('analytics/snowplow/transformers/EntryActionV2', () => {
  const BASE_EVENT = {
    data: {},
    contexts: [{ data: 1 }, { bar: 2 }],
  };

  let transform;

  beforeEach(async function () {
    transform = (eventData) => {
      when(EntityActionStub)
        .calledWith('entry:create', {
          ...eventData,
          actionData: {
            entity: 'Entry',
            action: 'create',
          },
        })
        .mockReturnValue(BASE_EVENT);
      return transformer('entry:create', eventData);
    };
  });

  it("adds `EntityAction`'s `contexts`", function () {
    const transformed = transform({});
    expect(transformed.contexts).toEqual(BASE_EVENT.contexts);
  });

  it('contains the base tracking data', function () {
    const eventData = {
      userId: 'USER_ID',
      organizationId: 'ORGANIZATION_ID',
      spaceId: 'SPACE_ID',
    };
    const transformed = transform(eventData);

    expect(transformed.data).toEqual({
      executing_user_id: eventData.userId,
      organization_id: eventData.organizationId,
      space_id: eventData.spaceId,
    });
  });

  it('adds the eventOrigin to the tracking data', function () {
    const transformed = transform({ response: { sys: { id: 'ENTRY_ID' } } });
    expect(transformed.data.entry_id).toEqual('ENTRY_ID');
  });

  describe('when there is an eventOrigin', () => {
    it('adds the `event_origin` to the tracking data', function () {
      const transformed = transform({ eventOrigin: 'entry-editor' });
      expect(transformed.data.event_origin).toEqual('entry-editor');
    });
  });

  describe('when there is a contentType', () => {
    const nonEntryReferenceFields = [
      { type: 'Object' },
      { type: 'Number' },
      { type: 'Symbol' },
      { type: 'Array', items: { type: 'Symbol' } },
      { type: 'Object' },
      { type: 'Link', linkType: 'Asset' },
      { type: 'Array', items: { type: 'Link', linkType: 'Asset' } },
    ];

    const entryReferenceFields = [
      { type: 'Link', linkType: 'Entry' },
      { type: 'Array', items: { type: 'Link', linkType: 'Entry' } },
    ];

    it('adds the number of entry reference fields to the tracking data', function () {
      const getEntryReferenceFieldCountWithFields = (fields) => {
        return transform({
          contentType: { fields },
        }).data.entry_ct_entry_reference_fields_count;
      };

      expect(getEntryReferenceFieldCountWithFields(nonEntryReferenceFields)).toEqual(0);

      expect(
        getEntryReferenceFieldCountWithFields([...nonEntryReferenceFields, ...entryReferenceFields])
      ).toEqual(entryReferenceFields.length);
    });
  });
});
