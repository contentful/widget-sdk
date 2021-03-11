import { getSlideInEntities, goToSlideInEntity } from '.';

import $state from 'ng/$state';

jest.mock('analytics/Analytics', () => ({}));
jest.mock('ng/$state', () => ({ params: {}, go: jest.fn() }));
jest.spyOn(window.history, 'pushState');

describe('SlideInNavigator', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = {};
  });

  afterAll(() => {
    window.location = location;
  });

  describe('getSlideInEntities()', () => {
    function testFn(message, { params = {}, search = '' }, expectedOutput) {
      it(message, () => {
        $state.params = params;
        window.location.search = search;

        const entities = getSlideInEntities();
        expect(entities).toEqual(expectedOutput);
      });
    }

    testFn('returns state params', { params: { entryId: 'entry-id' } }, [
      { id: 'entry-id', type: 'Entry' },
    ]);

    testFn(
      'returns ids from query string',
      {
        params: {
          entryId: 'entry-id-2',
        },
        search: {
          previousEntries: 'entry-id',
        },
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
      ]
    );

    testFn(
      'returns ids and tab from query string',
      {
        params: {
          entryId: 'entry-id-2',
          tab: 'Editor',
        },
        search: {
          previousEntries: 'entry-id',
        },
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry', tab: 'Editor' },
      ]
    );

    testFn(
      'ignores empty values',
      {
        params: {
          entryId: 'entry-id-3',
        },
        search: {
          previousEntries: ',,entry-id-1,,,entry-id-2,,',
        },
      },
      [
        { id: 'entry-id-1', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { id: 'entry-id-3', type: 'Entry' },
      ]
    );

    testFn(
      'contains no duplicate ids',
      {
        params: {
          entryId: 'entry-id-2',
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-1',
        },
      },
      [
        { id: 'entry-id-1', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
      ]
    );

    testFn(
      'returns asset id from query string',
      {
        params: {
          assetId: 'asset-id',
        },
        search: {
          previousEntries: 'entry-id,entry-id-2',
        },
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { id: 'asset-id', type: 'Asset' },
      ]
    );

    testFn(
      'bulk editor',
      {
        params: {
          entryId: 'entry-id',
          bulkEditor: 'field-id:locale-LOCALE:0',
        },
        search: {
          previousEntries: 'entry-id',
        },
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { path: ['entry-id', 'field-id', 'locale-LOCALE', 0], type: 'BulkEditor' },
      ]
    );

    testFn(
      'bulk editor and slides below',
      {
        params: {
          entryId: 'entry-id-2',
          bulkEditor: 'field-id:en-US:3',
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2',
        },
      },
      [
        { id: 'entry-id-1', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { path: ['entry-id-2', 'field-id', 'en-US', 3], type: 'BulkEditor' },
      ]
    );

    testFn(
      'slide below, bulk editor and slide on top',
      {
        params: {
          entryId: 'entry-id-2',
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-1:field-id:en-US:-1',
        },
      },
      [
        { id: 'entry-id-1', type: 'Entry' },
        { path: ['entry-id-1', 'field-id', 'en-US', -1], type: 'BulkEditor' },
        { id: 'entry-id-2', type: 'Entry' },
      ]
    );
  });

  describe('goToSlideInEntity()', () => {
    function testRedirect(message, { params, search, goToEntity }, expectedStateGoArgs) {
      it(message, () => {
        $state.params = params;
        window.location.search = search;

        const result = goToSlideInEntity(goToEntity);

        expect($state.go).toHaveBeenCalledTimes(1);
        expect($state.go).toHaveBeenCalledWith(...expectedStateGoArgs);

        const count = (ids) => (ids ? ids.split(',').length : 0);
        const oldSlideLevel = count(search.previousEntries);
        const newSlideLevel = count(expectedStateGoArgs[1].previousEntries);
        expect(result).toEqual({ oldSlideLevel, newSlideLevel });
      });
    }

    testRedirect(
      'adds up to 5+ entries in stack',
      {
        params: {
          entryId: 'entry-id-5',
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4',
        },
        goToEntity: { id: 'asset-id', type: 'Asset' },
      },
      [
        '^.^.assets.detail',
        {
          assetId: 'asset-id',
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4,entry-id-5',
        },
        { notify: false },
      ]
    );

    testRedirect(
      'removes all entries above given one if it is already in the stack',
      {
        params: {
          entryId: 'entry-id-4',
        },
        search: {
          previousEntries: 'entry-id-1,entry-id-2,entry-id-3',
        },
        goToEntity: { id: 'entry-id-2', type: 'Entry' },
      },
      [
        '^.^.entries.detail',
        {
          entryId: 'entry-id-2',
          previousEntries: 'entry-id-1',
          bulkEditor: null,
        },
        { notify: false },
      ]
    );
  });
});
