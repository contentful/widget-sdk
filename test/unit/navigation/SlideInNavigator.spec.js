import sinon from 'npm:sinon';

describe('SlideInNavigator', () => {
  beforeEach(function() {
    const params = sinon.stub();
    this.stateParams = params;
    this.search = sinon.stub();
    this.stateGo = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('$state', {
        get params() {
          return params();
        },
        go: this.stateGo
      });
      $provide.value('$location', {
        search: this.search
      });
    });

    this.slideInNavigator = this.$inject('navigation/SlideInNavigator');
  });

  describe('getSlideInEntities', () => {
    function getSlideInEntitiesTestFactory(message, { params = {}, search = {} }, expectedOutput) {
      it(message, function() {
        this.stateParams.returns(params);
        this.search.returns(search);

        const entities = this.slideInNavigator.getSlideInEntities();

        expect(entities).toEqual(expectedOutput);
      });
    }

    getSlideInEntitiesTestFactory('returns state params', { params: { entryId: 'entry-id' } }, [
      { id: 'entry-id', type: 'Entry' }
    ]);

    getSlideInEntitiesTestFactory(
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

    getSlideInEntitiesTestFactory(
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

    getSlideInEntitiesTestFactory(
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

    getSlideInEntitiesTestFactory(
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

  describe('goToSlideInEntity', () => {
    const FeatureFlagValue = {
      Off: 0,
      OnlyOneSlideInLevel: 1,
      InfiniteNumberOfLevels: 2
    };

    function willRedirect(
      message,
      {
        params = {
          entryId: 'entry-id-2'
        },
        search = {
          previousEntries: 'entry-id-0,entry-id-1'
        },
        goToEntity = { id: 'entry-id', type: 'Entry' },
        featureFlagValue
      },
      stateGoArgs
    ) {
      it(message, function() {
        this.stateParams.returns(params);
        this.search.returns(search);

        const result = this.slideInNavigator.goToSlideInEntity(goToEntity, featureFlagValue);

        sinon.assert.calledWith(this.stateGo, ...stateGoArgs);

        if (featureFlagValue === FeatureFlagValue.InfiniteNumberOfLevels) {
          const count = ids => [...ids].filter(char => char === ',').length;
          const currentSlideLevel = search.previousEntries ? count(search.previousEntries) + 1 : 0;
          const targetSlideLevel = count(stateGoArgs[1].previousEntries) + 1;
          expect(result).toEqual({ currentSlideLevel, targetSlideLevel });
        } else {
          expect(result).toEqual({ currentSlideLevel: 0, targetSlideLevel: 0 });
        }
      });
    }

    willRedirect(
      'redirects to entry page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off
      },
      [
        '^.^.entries.detail',
        {
          entryId: 'entry-id',
          previousEntries: ''
        }
      ]
    );

    willRedirect(
      'redirects to asset page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off,
        goToEntity: { id: 'asset-id', type: 'Asset' }
      },
      [
        '^.^.assets.detail',
        {
          assetId: 'asset-id',
          previousEntries: ''
        }
      ]
    );

    willRedirect(
      'one level of slide-in behaves like 0 levels (dropped support for this)',
      {
        featureFlagValue: FeatureFlagValue.OnlyOneSlideInLevel,
        params: {
          entryId: 'entry-id-0'
        },
        search: {},
        goToEntity: { id: 'asset-id', type: 'Asset' }
      },
      [
        '^.^.assets.detail',
        {
          assetId: 'asset-id',
          previousEntries: ''
        }
      ]
    );

    willRedirect(
      'adds up to 5+ entries in stack',
      {
        featureFlagValue: FeatureFlagValue.InfiniteNumberOfLevels,
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

    willRedirect(
      'removes all entries above given one if it is already in the stack',
      {
        featureFlagValue: FeatureFlagValue.InfiniteNumberOfLevels,
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
