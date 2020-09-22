import { createTagsFilter } from 'features/content-tags/core/state/tags-filter';

describe('A createTagsFilter function', () => {
  const createTag = (id, name) => ({ name, sys: { id, type: 'Tag' } });

  const tags = [
    createTag('one', 'One'),
    createTag('two', 'Two'),
    createTag('three', 'Three'),
    createTag('four', 'Four'),
    createTag('five', 'Five'),
  ];

  let tagsFilter;

  beforeEach(() => {
    tagsFilter = createTagsFilter(tags);
  });

  it('can filter by sys.id', () => {
    expect(tagsFilter({ match: 'One' })).toHaveLength(1);
  });

  it('can filter by name', () => {
    expect(tagsFilter({ match: 'One' })).toHaveLength(1);
  });

  it('can filter by a search string "t"', () => {
    expect(tagsFilter({ match: 't' })).toHaveLength(2);
  });

  it('can filter by a search string "t" and excluded tag', () => {
    expect(tagsFilter({ match: 't', exclude: ['two'] })).toHaveLength(1);
  });

  it('can exclude tags', () => {
    expect(tagsFilter({ exclude: ['two', 'five'] })).toHaveLength(3);
  });
});
