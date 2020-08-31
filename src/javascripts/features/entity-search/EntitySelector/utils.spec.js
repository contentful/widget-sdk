import { getValidContentTypes, isSearchUsed } from './utils';

describe('Entity Selector utils', () => {
  describe('getValidContentTypes', () => {
    it('should return only content types matching those whitelisted', () => {
      const accepted = ['Article', 'Page', 'BlogPost', 'Author'];
      const all = [
        { sys: { id: 'Subscription' } },
        { sys: { id: 'Author' } },
        { sys: { id: 'Reviewer' } },
        { sys: { id: 'BlogPost' } },
      ];

      expect(getValidContentTypes(accepted, all)).toEqual([
        { sys: { id: 'Author' } },
        { sys: { id: 'BlogPost' } },
      ]);
    });

    it('should return all content types if no specific ids', () => {
      const all = [
        { sys: { id: 'Subscription' } },
        { sys: { id: 'Author' } },
        { sys: { id: 'Reviewer' } },
        { sys: { id: 'BlogPost' } },
      ];

      expect(getValidContentTypes([], all)).toEqual(all);
    });

    it('should return all content types if accepted ids arg is not an array', () => {
      const all = [
        { sys: { id: 'Subscription' } },
        { sys: { id: 'Author' } },
        { sys: { id: 'Reviewer' } },
        { sys: { id: 'BlogPost' } },
      ];

      expect(getValidContentTypes({}, all)).toEqual(all);
      expect(getValidContentTypes(undefined, all)).toEqual(all);
      expect(getValidContentTypes(null, all)).toEqual(all);
    });
  });

  describe('isSearchUsed', () => {
    it('should return false if searchState is falsy', () => {
      expect(isSearchUsed(undefined)).toBe(false);
      expect(isSearchUsed(null)).toBe(false);
    });

    it('should return true if at least one search filter is present', () => {
      const searchState = {
        searchFilters: [['__title', '', 'test']],
      };
      expect(isSearchUsed(searchState)).toBe(true);
    });

    it('should return true if contentTypeId is defined', () => {
      const searchState = {
        contentTypeId: 'Article',
      };
      expect(isSearchUsed(searchState)).toBe(true);
    });

    it('should return true if searchText is defined', () => {
      const searchState = {
        searchText: 'test',
      };
      expect(isSearchUsed(searchState)).toBe(true);
    });
  });
});
