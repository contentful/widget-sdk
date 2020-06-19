import { computeState, transformEntities } from 'features/content-tags/editor/hooks/useComputeTags';
import { tagLink as toTagLink } from 'features/content-tags/editor/utils';

const setUp = () => {
  const newTag = { value: 'ny', label: 'New York' };
  const newTagLink = toTagLink(newTag.value);

  const removeTag = { value: 'sf', occurrence: 1, label: 'San Francisco', changeType: 'REMOVED' };
  const applyTag = { value: 'mkt', occurrence: 1, label: 'Marketing', changeType: 'ALL' };
  const applyTagLink = toTagLink(applyTag.value);

  const state = computeState({ tags: [removeTag, applyTag], newTags: [newTag] });
  const computedState = { all: [applyTagLink, newTagLink], remove: [removeTag.value] };

  const selectedEntities = [
    {
      data: {
        sys: {
          id: 'xxxx',
        },
        fields: {},
        metadata: {
          tags: [
            { sys: { type: 'Link', linkType: 'Tag', id: 'samples' } },
            { sys: { type: 'Link', linkType: 'Tag', id: 'sf' } },
          ],
        },
      },
    },
  ];

  const transformedEntities = [
    {
      data: {
        sys: {
          id: 'xxxx',
        },
        fields: {},
        metadata: {
          tags: [
            { sys: { type: 'Link', linkType: 'Tag', id: 'samples' } },
            { sys: { type: 'Link', linkType: 'Tag', id: 'mkt' } },
            { sys: { type: 'Link', linkType: 'Tag', id: 'ny' } },
          ],
        },
      },
    },
  ];

  return { state, computedState, selectedEntities, transformedEntities };
};

describe('computedState', () => {
  it('has a state with tags to be removed', () => {
    const tag = { value: 'and', occurrence: 1, label: 'and', changeType: 'REMOVED' };
    const state = computeState({ tags: [tag], newTags: [] });
    expect(state).toEqual({ all: [], remove: [tag.value] });
  });

  it('has a state with tags to be applied', () => {
    const tag = { value: 'and', occurrence: 1, label: 'and', changeType: 'ALL' };
    const tagLink = toTagLink(tag.value);
    const state = computeState({ tags: [tag], newTags: [] });

    expect(state).toEqual({ all: [tagLink], remove: [] });
  });

  it('has a state with newly added tags to be applied', () => {
    const { state, computedState: expected } = setUp();
    expect(state).toEqual(expected);
  });
});

describe('transformEntities', () => {
  it('returns an empty array if selected entities is empty', () => {
    const entities = transformEntities([], {});
    expect(entities).toEqual([]);
  });

  it('returns entities with the correct tags to be added', () => {
    const { state, selectedEntities, transformedEntities: expected } = setUp();
    const entities = transformEntities(selectedEntities, state);

    expect(entities).toEqual(expected);
  });
});
