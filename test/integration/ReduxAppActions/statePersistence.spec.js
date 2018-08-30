describe('statePersistence redux module', () => {
  beforeEach(function() {
    this.createUsersEndpoint = sinon.stub();
    this.createSpaceEndpoint = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('data/EndpointFactory', {
        createUsersEndpoint: this.createUsersEndpoint,
        createSpaceEndpoint: this.createSpaceEndpoint
      });
    });
    const { createStore, applyMiddleware, combineReducers } = this.$inject('redux');
    const thunk = this.$inject('redux-thunk').default;
    const reducer = this.$inject('ReduxAppActions/statePersistence/reducer').default;
    this.actions = this.$inject('ReduxAppActions/statePersistence/actionCreators');
    this.selectors = this.$inject('ReduxAppActions/statePersistence/selectors');
    this.store = createStore(
      combineReducers({
        statePersistence: reducer
      }),
      applyMiddleware(thunk)
    );
  });

  [
    {
      name: 'user state module',
      endpoint: 'createUsersEndpoint',
      fetchAction: 'fetchUserState',
      updateAction: 'updateUserState',
      selector: 'getUserState'
    },
    {
      name: 'user environenment state module',
      endpoint: 'createSpaceEndpoint',
      fetchAction: 'fetchUserEnvState',
      updateAction: 'updateUserEnvState',
      selector: 'getUserEnvState',
      params: {
        spaceId: 'w56asxg',
        envId: 'master'
      }
    },
    {
      name: 'env state module',
      endpoint: 'createSpaceEndpoint',
      fetchAction: 'fetchEnvState',
      updateAction: 'updateEnvState',
      selector: 'getEnvState',
      params: {
        spaceId: 'w56asxg',
        envId: 'master'
      }
    }
  ].map(({ name, endpoint, fetchAction, updateAction, selector, params }) => {
    describe(name, () => {
      afterEach(async function() {
        if (this.promise) {
          await this.promise;
        }
      });

      it('fetch user state correctly', async function() {
        const data = {
          sys: {
            version: 1
          },
          some: true
        };
        const key = 'my_key';
        this[endpoint].returns(() => {
          return Promise.resolve(data);
        });
        await this.store.dispatch(this.actions[fetchAction]({ key, ...params }));

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.data).toBe(data);
        expect(persistenceState.isPending).toBe(false);
      });

      it('set isPending status correctly after making a request', async function() {
        const data = {
          sys: {
            version: 1
          },
          some: true
        };
        const key = 'my_key';
        this[endpoint].returns(() => {
          return Promise.resolve(data);
        });
        this.promise = this.store.dispatch(this.actions[fetchAction]({ key, ...params }));

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.isPending).toBe(true);
      });

      it('set error status in case request failed with an error', async function() {
        const error = new Error('some error');
        const key = 'my_key';
        this[endpoint].returns(() => {
          return Promise.reject(error);
        });
        await this.store.dispatch(this.actions[fetchAction]({ key, ...params }));

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.error).toBe(error);
        expect(persistenceState.isPending).toBe(false);
      });

      it("two keys don't affect each other during fetch", async function() {
        const data1 = {
          sys: {
            version: 1
          },
          some: true
        };
        const key1 = 'my_key_1';
        this[endpoint].returns(() => {
          return Promise.resolve(data1);
        });
        const firstRequest = this.store.dispatch(
          this.actions[fetchAction]({ key: key1, ...params })
        );
        const data2 = {
          sys: {
            version: 2
          },
          another: true
        };
        const key2 = 'my_key_2';
        this[endpoint].returns(() => {
          return Promise.resolve(data2);
        });
        const secondRequest = this.store.dispatch(
          this.actions[fetchAction]({ key: key2, ...params })
        );

        await Promise.all([firstRequest, secondRequest]);

        const persistenceState1 = this.selectors[selector]({
          state: this.store.getState(),
          key: key1,
          ...params
        });
        const persistenceState2 = this.selectors[selector]({
          state: this.store.getState(),
          key: key2,
          ...params
        });

        expect(persistenceState1.data).toBe(data1);
        expect(persistenceState2.data).toBe(data2);
      });

      it('update data optimistically', function() {
        const data = {
          sys: {
            version: 1
          },
          some: true
        };
        const key = 'my_key';
        this[endpoint].returns(() => {
          return new Promise(resolve => setTimeout(resolve, 50, { random: true }));
        });
        this.promise = this.store.dispatch(
          this.actions[updateAction]({ key, payload: data, ...params })
        );

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.isUpdating).toBe(true);
        expect(persistenceState.data).toBe(data);
      });

      it('rollback data if update is unsuccessfull', async function() {
        // set data first
        const data = {
          sys: {
            version: 1
          },
          some: true
        };
        const key = 'my_key';
        this[endpoint].returns(() => {
          return Promise.resolve(data);
        });
        await this.store.dispatch(this.actions[fetchAction]({ key, ...params }));

        const error = new Error('some update error');
        this[endpoint].returns(() => {
          return Promise.reject(error);
        });

        const newData = {
          ...data,
          another: true
        };
        await this.store.dispatch(this.actions[updateAction]({ key, payload: newData, ...params }));

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.isUpdating).toBe(false);
        expect(persistenceState.updatingError).toBe(error);
        expect(persistenceState.data).toBe(data);
      });

      it('update state successfully', async function() {
        const data = {
          sys: { version: 1 },
          some: true
        };
        const newData = {
          sys: { version: 2 },
          some: true
        };
        const key = 'my_key';
        this[endpoint].returns(() => {
          return Promise.resolve(newData);
        });
        await this.store.dispatch(
          this.actions[updateAction]({ key: 'my_key', payload: data, ...params })
        );

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.updatingError).toBe(null);
        expect(persistenceState.isUpdating).toBe(false);
        expect(persistenceState.data).toBe(newData);
      });

      it('update status successfully if first request errors, but the subsequent in the meantime succeeds', async function() {
        const key = 'my_key';
        this[endpoint].returns(() => {
          // eslint-disable-next-line no-unused-vars
          return new Promise((resolve, reject) => setTimeout(reject, 50, new Error('some error')));
        });
        const firstRequestPromise = this.store.dispatch(
          this.actions[updateAction]({ key: 'my_key', payload: { some: true }, ...params })
        );
        this[endpoint].returns(() => {
          return new Promise(resolve =>
            setTimeout(resolve, 50, {
              sys: {
                version: 2
              },
              some: true,
              another: false
            })
          );
        });
        const secondRequestPromise = this.store.dispatch(
          this.actions[updateAction]({
            key: 'my_key',
            payload: { some: true, another: false, sys: { version: 1 } },
            ...params
          })
        );

        await Promise.all([firstRequestPromise, secondRequestPromise]);

        const persistenceState = this.selectors[selector]({
          state: this.store.getState(),
          key,
          ...params
        });

        expect(persistenceState.updatingError).toBe(null);
        expect(persistenceState.data).toEqual({
          sys: {
            version: 2
          },
          some: true,
          another: false
        });
      });

      it("two keys don't affect each other during update", async function() {
        const data1 = {
          sys: {
            version: 1
          },
          some: true
        };
        const key1 = 'my_key_1';
        this[endpoint].returns(() => {
          return Promise.resolve(data1);
        });
        const firstRequest = this.store.dispatch(
          this.actions[updateAction]({ key: key1, ...params })
        );
        const data2 = {
          sys: {
            version: 2
          },
          another: true
        };
        const key2 = 'my_key_2';
        this[endpoint].returns(() => {
          return Promise.resolve(data2);
        });
        const secondRequest = this.store.dispatch(
          this.actions[updateAction]({ key: key2, ...params })
        );

        await Promise.all([firstRequest, secondRequest]);

        const persistenceState1 = this.selectors[selector]({
          state: this.store.getState(),
          key: key1,
          ...params
        });
        const persistenceState2 = this.selectors[selector]({
          state: this.store.getState(),
          key: key2,
          ...params
        });

        expect(persistenceState1.data).toBe(data1);
        expect(persistenceState2.data).toBe(data2);
      });
    });
  });
});
