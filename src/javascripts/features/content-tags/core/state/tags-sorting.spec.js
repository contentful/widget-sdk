import { tagsSorter } from 'features/content-tags/core/state/tags-sorting';

const createTag = (id, name) => ({
  name,
  sys: { id, type: 'Tag', createdAt: Date.now().toString() },
});
const numbersArray = [...Array(10).keys()];
const lettersArray = ['a', 'b', 'C'];

describe('A tags sorting function', () => {
  const tags = [];
  describe('can sort by date', () => {
    beforeAll(async () => {
      for (const n in numbersArray) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        tags.push(createTag(`tag-id-${n}`, `Tag Name ${n}`));
      }
    });

    it('by created DESC', () => {
      expect(tagsSorter(tags, 'DESC')[0].sys.id).toBe('tag-id-9');
    });

    it('by created ASC', () => {
      expect(tagsSorter(tags, 'ASC')[0].sys.id).toBe('tag-id-0');
    });
  });

  describe('can sort alphabetically and is case insensitive', () => {
    const abcTags = [];
    beforeAll(() => {
      for (const l of lettersArray) {
        abcTags.push(createTag(`${l}-tag-id`, `${l} Tag Name`));
      }
    });
    it('by id ASC', () => {
      expect(tagsSorter(abcTags, 'idASC')[0].sys.id).toBe('a-tag-id');
    });
    it('by id DESC', () => {
      expect(tagsSorter(abcTags, 'idDESC')[0].sys.id).toBe('C-tag-id');
    });
    it('by name ASC', () => {
      expect(tagsSorter(abcTags, 'nameASC')[0].name).toBe('a Tag Name');
    });
    it('by name DESC', () => {
      expect(tagsSorter(abcTags, 'nameDESC')[0].name).toBe('C Tag Name');
    });
  });
});
