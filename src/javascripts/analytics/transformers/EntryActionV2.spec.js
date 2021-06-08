import transformer from './EntryActionV2';
import EntityActionStub from './EntityAction';
import { when } from 'jest-when';

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
    const { contexts } = transform({});
    expect(contexts).toEqual(BASE_EVENT.contexts);
  });

  it('contains the base tracking data', function () {
    const eventData = {
      userId: 'USER_ID',
      organizationId: 'ORGANIZATION_ID',
      spaceId: 'SPACE_ID',
    };
    const { data } = transform(eventData);

    expect(data).toEqual({
      executing_user_id: eventData.userId,
      organization_id: eventData.organizationId,
      space_id: eventData.spaceId,
    });
  });

  describe('when an entry is given', () => {
    it('adds the `entry_id` to the tracking data', function () {
      const { data } = transform({ response: { sys: { id: 'ENTRY_ID', version: 42 } } });
      expect(data.entry_id).toEqual('ENTRY_ID');
    });

    it('adds the `entry_version` to the tracking data', function () {
      const { data } = transform({ response: { sys: { id: 'ENTRY_ID', version: 42 } } });
      expect(data.entry_version).toEqual(42);
    });
  });

  describe('when there is an eventOrigin', () => {
    it('adds the `event_origin` to the tracking data', function () {
      const { data } = transform({ eventOrigin: 'entry-editor' });
      expect(data.event_origin).toEqual('entry-editor');
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

    const newCT = (fields = nonEntryReferenceFields) => ({ sys: { id: 'CT-ID' }, fields });

    it('adds a `content_type_id` to the tracking data', () => {
      const { data } = transform({
        contentType: newCT(),
      });
      expect(data.content_type_id).toEqual('CT-ID');
    });

    it('adds a `entry_ct_fields_count` to the tracking data', () => {
      const { data } = transform({
        contentType: newCT([...nonEntryReferenceFields, ...entryReferenceFields]),
      });
      expect(data.entry_ct_fields_count).toEqual(9);
    });

    it('adds the number of entry reference fields to the tracking data', function () {
      const getEntryReferenceFieldCountWithFields = (fields = []) =>
        transform({
          contentType: newCT(fields),
        }).data.entry_ct_entry_reference_fields_count;

      expect(getEntryReferenceFieldCountWithFields(nonEntryReferenceFields)).toEqual(0);

      expect(
        getEntryReferenceFieldCountWithFields([...nonEntryReferenceFields, ...entryReferenceFields])
      ).toEqual(entryReferenceFields.length);
    });
  });
});
