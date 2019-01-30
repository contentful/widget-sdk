import { getSlideInEntities, goToSlideInEntity } from './index.es6';

import $location from 'ng/$location';
import $state from 'ng/$state';

jest.mock('analytics/Analytics.es6', () => ({}));
jest.mock('ng/$location', () => ({ search: jest.fn() }));
jest.mock('ng/$state', () => ({ params: {}, go: jest.fn() }));

describe('SlideInNavigator', () => {
  beforeEach(jest.clearAllMocks);

  describe('getSlideInEntities()', () => {
    function testFn(message, { params = {}, search = {} }, expectedOutput) {
      it(message, () => {
        $state.params = params;
        $location.search.mockReturnValue(search);

        const entities = getSlideInEntities();

        expect(entities).toEqual(expectedOutput);
      });
    }

    testFn('returns state params', { params: { entryId: 'entry-id' } }, [
      { id: 'entry-id', type: 'Entry' }
    ]);

    testFn(
      'returns ids from query string',
      {
        params: {
          entryId: 'entry-id-2'
        },
        search: {
          previousEntries: 'entry-id'
        }
      },
      [{ id: 'entry-id', type: 'Entry' }, { id: 'entry-id-2', type: 'Entry' }]
    );

    testFn(
      'ignores empty values',
      {
        params: {
          entryId: 'entry-id-3'
        },
        search: {
          previousEntries: ',,entry-id-1,,,entry-id-2,,'
        }
      },
      [
        { id: 'entry-id-1', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { id: 'entry-id-3', type: 'Entry' }
      ]
    );

    testFn(
      'contains no duplicate ids',
      {
        params: {
          entryId: 'entry-id-2'
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-1'
        }
      },
      [{ id: 'entry-id-1', type: 'Entry' }, { id: 'entry-id-2', type: 'Entry' }]
    );

    testFn(
      'returns asset id from query string',
      {
        params: {
          assetId: 'asset-id'
        },
        search: {
          previousEntries: 'entry-id,entry-id-2'
        }
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { id: 'asset-id', type: 'Asset' }
      ]
    );
  });

  describe('goToSlideInEntity()', () => {
    function testRedirect(message, { params, search, goToEntity }, expectedStateGoArgs) {
      it(message, () => {
        $state.params = params;
        $location.search.mockReturnValue(search);

        const result = goToSlideInEntity(goToEntity);

        expect($state.go).toHaveBeenCalledTimes(1);
        expect($state.go).toHaveBeenCalledWith(...expectedStateGoArgs);

        const count = ids => (ids ? ids.split(',').length : 0);
        const currentSlideLevel = count(search.previousEntries);
        const targetSlideLevel = count(expectedStateGoArgs[1].previousEntries);
        expect(result).toEqual({ currentSlideLevel, targetSlideLevel });
      });
    }

    testRedirect(
      'adds up to 5+ entries in stack',
      {
        params: {
          entryId: 'entry-id-5'
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4'
        },
        goToEntity: { id: 'asset-id', type: 'Asset' }
      },
      [
        '^.^.assets.detail',
        {
          assetId: 'asset-id',
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4,entry-id-5'
        }
      ]
    );

    testRedirect(
      'removes all entries above given one if it is already in the stack',
      {
        params: {
          entryId: 'entry-id-4'
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3'
        },
        goToEntity: { id: 'entry-id-2', type: 'Entry' }
      },
      [
        '^.^.entries.detail',
        {
          entryId: 'entry-id-2',
          previousEntries: 'entry-id-1'
        }
      ]
    );
  });
});
