describe('App Resources action creators', function() {
  beforeEach(function() {
    this.stubs = {
      ResourceService_getAll: sinon.stub().resolves([]),
      dispatch: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('services/ResourceService.es6', {
        default: () => {
          return {
            getAll: this.stubs.ResourceService_getAll
          };
        }
      });
    });

    this.dispatch = (action, ...args) => {
      return action(...args)(this.stubs.dispatch);
    };

    this.assertDispatch = (order, object) => {
      return expect(this.stubs.dispatch.args[order]).toEqual([object]);
    };

    this.spaceId = 'space_1234';
    this.actionCreators = this.$inject('ReduxAppActions/resources/actionCreators.es6');
    this.actions = this.$inject('ReduxAppActions/resources/actions.es6');
  });

  describe('getResourcesForSpace', function() {
    beforeEach(function() {
      this.actionCreator = this.actionCreators.getResourcesForSpace;
    });

    it('should dispatch 3 times on success', async function() {
      await this.dispatch(this.actionCreator, this.spaceId);

      expect(this.stubs.dispatch.callCount).toBe(3);
      this.assertDispatch(0, {
        type: this.actions.RESOURCES_FOR_SPACE_PENDING,
        spaceId: this.spaceId,
        isPending: true
      });
      this.assertDispatch(1, {
        type: this.actions.RESOURCES_FOR_SPACE_SUCCESS,
        spaceId: this.spaceId,
        value: []
      });
      this.assertDispatch(2, {
        type: this.actions.RESOURCES_FOR_SPACE_PENDING,
        spaceId: this.spaceId,
        isPending: false
      });
    });

    it('should dispatch 3 times on failure', async function() {
      const error = new Error('getAll failed');

      this.stubs.ResourceService_getAll.throws(error);

      await this.dispatch(this.actionCreator, this.spaceId);

      expect(this.stubs.dispatch.callCount).toBe(3);
      this.assertDispatch(0, {
        type: this.actions.RESOURCES_FOR_SPACE_PENDING,
        spaceId: this.spaceId,
        isPending: true
      });
      this.assertDispatch(1, {
        type: this.actions.RESOURCES_FOR_SPACE_FAILURE,
        spaceId: this.spaceId,
        error
      });
      this.assertDispatch(2, {
        type: this.actions.RESOURCES_FOR_SPACE_PENDING,
        spaceId: this.spaceId,
        isPending: false
      });
    });
  });
});
