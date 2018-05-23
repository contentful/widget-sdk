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

        expect(this.search.calledOnce).toBe(true);
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
          entryId: 'entry-id'
        },
        search: {
          slideIn: ['Entry:entry-id-2']
        }
      },
      [{ id: 'entry-id', type: 'Entry' }, { id: 'entry-id-2', type: 'Entry' }]
    );

    getSlideInEntitiesTestFactory(
      'returns asset id from query string',
      {
        params: {
          entryId: 'entry-id'
        },
        search: {
          slideIn: ['Entry:entry-id-2', 'Asset:asset-id']
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
      InfiniteNumberOfLevelsAndEternalGlory: 2
    };

    function willRedirect (
      message,
      {
        params = {
          entryId: 'entry-id-0'
        },
        search = {
          slideIn: ['entry:entry-id-2', 'entry:entry-id-1']
        },
        entity = { id: 'entry-id', type: 'Entry' },
        featureFlagValue
      },
      stateGoArgs
    ) {
      it(message, function () {
        this.stateParams.returns(params);
        this.search.returns(search);

        const result = this.entityNavigationHelper.goToSlideInEntity(
          entity,
          featureFlagValue
        );

        expect(this.search.calledOnce).toBe(true);
        expect(this.stateGo.calledWith(...stateGoArgs)).toBe(true);
        expect(result).toEqual(undefined);
      });
    }

    function willReplaceState (
      message,
      {
        params = {
          entryId: 'entry-id-0'
        },
        search = {},
        entity = { id: 'entry-id', type: 'Entry' },
        featureFlagValue
      },
      searchArgs
    ) {
      it(message, function () {
        this.stateParams.returns(params);
        this.search.returns(search);

        const result = this.entityNavigationHelper.goToSlideInEntity(
          entity,
          featureFlagValue
        );

        expect(this.search.calledWith('slideIn', searchArgs)).toBe(true);
        expect(result).toEqual({
          currentSlideLevel: search.slideIn ? search.slideIn.length : 0,
          targetSlideLevel: searchArgs.length
        });
      });
    }

    willRedirect(
      'redirects to entry page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off
      },
      ['.', { entryId: 'entry-id' }]
    );

    willRedirect(
      'redirects to asset page if the feature flag is off',
      {
        featureFlagValue: FeatureFlagValue.Off,
        entity: { id: 'asset-id', type: 'Asset' }
      },
      ['^.^.assets.detail', { assetId: 'asset-id' }]
    );

    willRedirect(
      'redirects to entry page if the slide in limit is reached',
      {
        params: {
          entryId: 'entry-id-0'
        },
        search: {
          slideIn: ['entry:entry-id-1']
        },
        featureFlagValue: FeatureFlagValue.OnlyOneSlideInLevel
      },
      ['.', { entryId: 'entry-id' }]
    );

    willReplaceState(
      'adds slidein entry to stack',
      {
        featureFlagValue: FeatureFlagValue.OnlyOneSlideInLevel
      },
      ['Entry:entry-id']
    );

    willReplaceState(
      'adds slidein asset to stack',
      {
        featureFlagValue: FeatureFlagValue.OnlyOneSlideInLevel,
        entity: { id: 'asset-id', type: 'Asset' }
      },
      ['Asset:asset-id']
    );

    willReplaceState(
      'adds up to 5+ entries in stack',
      {
        featureFlagValue:
          FeatureFlagValue.InfiniteNumberOfLevelsAndEternalGlory,
        search: {
          slideIn: [
            'Entry:entry-id-1',
            'Entry:entry-id-2',
            'Entry:entry-id-3',
            'Entry:entry-id-4',
            'Entry:entry-id-5'
          ]
        },
        entity: { id: 'entry-id', type: 'Entry' }
      },
      [
        'Entry:entry-id-1',
        'Entry:entry-id-2',
        'Entry:entry-id-3',
        'Entry:entry-id-4',
        'Entry:entry-id-5',
        'Entry:entry-id'
      ]
    );
  });
});
