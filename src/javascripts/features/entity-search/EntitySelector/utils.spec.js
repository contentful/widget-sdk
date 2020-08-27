import {
  extendSelectionMap,
  getValidContentTypes,
  toSelectionMap,
  selectionMapToEntities,
  isSearchUsed,
} from './utils';

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

  describe('toSelectionMap', () => {
    it('should convert array of entities to selectionMap', () => {
      const entities = [
        { sys: { type: 'Entry', id: 'id-1' } },
        { sys: { type: 'Entry', id: 'id-2' } },
        { sys: { type: 'Entry', id: 'id-3' } },
        { sys: { type: 'Asset', id: 'id-4' } },
        { sys: { type: 'Entry', id: 'id-5' } },
      ];

      expect(toSelectionMap(entities)).toEqual({
        'id-1': false,
        'id-2': false,
        'id-3': false,
        'id-4': false,
        'id-5': false,
      });
    });
  });

  describe('extendSelectionMap', () => {
    it('should return the map untouched if either one of the arguments is falsy', () => {
      expect(extendSelectionMap(null, {})).toBeNull();
      expect(extendSelectionMap({}, null)).toEqual({});
    });

    it('should extend existing map keeping the state of it', () => {
      const existingMap = {
        'id-1': false,
        'id-2': true,
        'id-3': false,
        'id-4': true,
        'id-5': true,
      };

      const mapExtension = {
        'id-2': false,
        'id-4': false,
        'id-5': false,
        'id-6': false,
        'id-7': false,
      };

      expect(extendSelectionMap(existingMap, mapExtension)).toEqual({
        'id-1': false,
        'id-2': true,
        'id-3': false,
        'id-4': true,
        'id-5': true,
        'id-6': false,
        'id-7': false,
      });
    });
  });

  describe('selectionMapToEntities', () => {
    it('should return only selected entities omitting duplicates', () => {
      const map = {
        'id-1': false,
        'id-2': true,
        'id-3': false,
        'id-4': true,
        'id-5': true,
      };

      const entities = [
        { sys: { type: 'Entry', id: 'id-1' } },
        { sys: { type: 'Entry', id: 'id-5' } },
        { sys: { type: 'Entry', id: 'id-2' } },
        { sys: { type: 'Entry', id: 'id-3' } },
        { sys: { type: 'Asset', id: 'id-4' } },
        { sys: { type: 'Entry', id: 'id-2' } },
        { sys: { type: 'Entry', id: 'id-5' } },
      ];

      expect(selectionMapToEntities(map, entities)).toEqual([
        { sys: { type: 'Entry', id: 'id-5' } },
        { sys: { type: 'Entry', id: 'id-2' } },
        { sys: { type: 'Asset', id: 'id-4' } },
      ]);
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
