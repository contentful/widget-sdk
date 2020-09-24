import { tagsSorter } from 'features/content-tags/core/state/tags-sorting';

const createTag = (id, name) => ({
  name,
  sys: { id, type: 'Tag', createdAt: Date.now().toString() },
});
const numbersArray = [...Array(10).keys()];

describe('A tags sorting function', () => {
  const tags = [];

  beforeAll(async () => {
    for (const n in numbersArray) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      tags.push(createTag(`tag-id-${n}`, `Tag Name ${n}`));
    }
  });

  it('can sort tags by date created DESC', () => {
    expect(tagsSorter(tags, 'DESC')[0].sys.id).toBe('tag-id-9');
  });

  it('can sort tags by date created ASC', () => {
    expect(tagsSorter(tags, 'ASC')[0].sys.id).toBe('tag-id-0');
  });
});
