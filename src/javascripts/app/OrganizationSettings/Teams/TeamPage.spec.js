import React from 'react';
import { Provider } from 'react-redux';
import { noop } from 'lodash';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import reducer from 'redux/reducer';

import TeamPage from './TeamPage.es6';
import TeamList from './TeamList.es6';
import TeamDetails from './TeamDetails.es6';

const renderComponent = (actions, onReady = noop) => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamPage onReady={onReady} />
    </Provider>
  );
  return { store, wrapper };
};

describe('TeamPage', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });

  describe('is at teams route', () => {
    beforeEach(() => {
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: { location: { pathname: '/account/organizations/3G4pdEF8qK2waWQfNHYKPo/teams' } }
      });
    });

    it('should render nothing', () => {
      const { wrapper } = renderComponent(actions);
      expect(wrapper.find(TeamList)).toHaveLength(0);
      expect(wrapper.find(TeamDetails)).toHaveLength(0);
    });

    describe('teams were loaded', () => {
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          payload: {
            datasets: {
              Team: [],
              TeamMemberships: []
            }
          }
        });
      });

      it('should render TeamList', () => {
        const { wrapper } = renderComponent(actions);
        expect(wrapper.find(TeamList)).toHaveLength(1);
      });
    });
  });
});
