import sinon from 'npm:sinon';

describe('EntityNavigationHelpers', function () {
  beforeEach(function () {
    const params = sinon.stub();
    this.stateParams = params;
    this.search = sinon.stub();
    this.stateGo = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('$state', {
        get params () {
          return params();
        },
        go: this.stateGo
      });
      $provide.value('$location', {
        search: this.search
      });
    });

    this.entityNavigationHelper = this.$inject(
      'states/EntityNavigationHelpers'
    );
  });

  describe('getSlideInEntities', function () {
    function getSlideInEntitiesTestFactory (
      message,
      { params = {}, search = {} },
      expectedOutput
    ) {
      it(message, function () {
        this.stateParams.returns(params);
        this.search.returns(search);

        const entities = this.entityNavigationHelper.getSlideInEntities();

        expect(entities).toEqual(expectedOutput);
      });
    }

    getSlideInEntitiesTestFactory(
      'returns state params',
      { params: { entryId: 'entry-id' } },
      [{ id: 'entry-id', type: 'Entry' }]
    );

    getSlideInEntitiesTestFactory(
      'returns ids from query string',
      {
        params: {
          entryId: 'entry-id-2'
        },
        search: {
          slideIn: 'entry-id'
        }
      },
      [{ id: 'entry-id', type: 'Entry' }, { id: 'entry-id-2', type: 'Entry' }]
    );

    getSlideInEntitiesTestFactory(
      'contains no duplicate ids',
      {
        params: {
          entryId: 'entry-id-2'
        },
        search: {
          slideIn: 'entry-id-1,entry-id-2,entry-id-1'
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
          slideIn: 'entry-id,entry-id-2'
        }
      },
      [
        { id: 'entry-id', type: 'Entry' },
        { id: 'entry-id-2', type: 'Entry' },
        { id: 'asset-id', type: 'Asset' }
      ]
    );
  });

  describe('goToSlideInEntity', function () {
    const FeatureFlagValue = {
      Off: 0,
      OnlyOneSlideInLevel: 1,
      InfiniteNumberOfLevels: 2
    };

    function willRedirect (
      message,
      {
        params = {
          entryId: 'entry-id-2'
        },
        search = {
          slideIn: 'entry-id-0,entry-id-1'
        },
        goToEntity = { id: 'entry-id', type: 'Entry' },
        featureFlagValue
      },
      stateGoArgs
    ) {
      it(message, function () {
        this.stateParams.returns(params);
        this.search.returns(search);

        const result = this.entityNavigationHelper.goToSlideInEntity(
          goToEntity,
          featureFlagValue
        );

        sinon.assert.calledWith(this.stateGo, ...stateGoArgs);

        if (featureFlagValue === FeatureFlagValue.InfiniteNumberOfLevels) {
          const count = (ids) => [...ids].filter(char => char === ',').length;
          const currentSlideLevel = search.slideIn ? count(search.slideIn) + 1 : 0;
          const targetSlideLevel = count(stateGoArgs[1].slideIn) + 1;
          expect(result).toEqual({ currentSlideLevel, targetSlideLevel });
        } else {
          expect(result).toEqual(undefined);
        }
      });
    }

    willRedirect(
      'redirects to entry page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off
      },
      ['.', {
        entryId: 'entry-id',
        slideIn: ''
      }]
    );

    willRedirect(
      'redirects to asset page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off,
        goToEntity: { id: 'asset-id', type: 'Asset' }
      },
      ['^.^.assets.detail', {
        assetId: 'asset-id',
        slideIn: ''
      }]
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
      ['^.^.assets.detail', {
        assetId: 'asset-id',
        slideIn: ''
      }]
    );

    willRedirect(
      'adds up to 5+ entries in stack',
      {
        featureFlagValue: FeatureFlagValue.InfiniteNumberOfLevels,
        params: {
          entryId: 'entry-id-5'
        },
        search: {
          slideIn: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4'
        },
        goToEntity: { id: 'asset-id', type: 'Asset' }
      },
      ['^.^.assets.detail', {
        assetId: 'asset-id',
        slideIn: 'entry-id-1,entry-id-2,entry-id-3,entry-id-4,entry-id-5'
      }]
    );

    willRedirect(
      'removes all entries above given one if it is already in the stack',
      {
        featureFlagValue: FeatureFlagValue.InfiniteNumberOfLevels,
        params: {
          entryId: 'entry-id-4'
        },
        search: {
          slideIn: 'entry-id-1,entry-id-2,entry-id-3'
        },
        goToEntity: { id: 'entry-id-2', type: 'Entry' }
      },
      ['^.^.entries.detail', {
        entryId: 'entry-id-2',
        slideIn: 'entry-id-1'
      }]
    );
  });
});
