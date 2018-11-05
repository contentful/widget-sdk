import store from 'ReduxStore/store.es6';

export default $scope => {
  $scope.$watchCollection('user', user => {
    if (user) {
      store.dispatch({ type: 'ANGULAR_SCOPE_UPDATE', payload: { user } });
    }
  });

  $scope.$watchCollection('spaceContext', spaceContext => {
    if (spaceContext && spaceContext.space) {
      store.dispatch({
        type: 'ANGULAR_SCOPE_UPDATE',
        payload: {
          organization: spaceContext.organization,
          environments: spaceContext.environments,
          space: spaceContext.space.data // redux actions and state only allow serializable properties
        }
      });
    }
  });

  $scope.$watchGroup(['spaceContext.space', 'user'], ([space, user]) => {
    if (!space) {
      store.dispatch({
        type: 'ANGULAR_SCOPE_UPDATE',
        payload: { space: null, environments: null, organization: null }
      });
    }
    store.dispatch({ type: 'ANGULAR_SCOPE_UPDATE', payload: { user } });
  });
};
