import React from 'react';
import { Provider } from 'react-redux';
import { noop } from 'lodash';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import reducer from 'redux/reducer';

import Placeholder from 'app/common/Placeholder.es6';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';
import ROUTES from 'redux/routes.es6';
import { FEATURE_INACTIVE } from 'redux/accessConstants.es6';

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
    let onReadyMock;

    beforeEach(() => {
      onReadyMock = jest.fn(noop);
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: {
          location: { pathname: ROUTES.organization.children.teams.build({ orgId: 'testOrg' }) }
        }
      });
    });

    it('should not have called onReady', () => {
      renderComponent(actions, onReadyMock);
      expect(onReadyMock).not.toHaveBeenCalled();
    });

    it('should render nothing', () => {
      const { wrapper } = renderComponent(actions);
      expect(wrapper.find(TeamList)).toHaveLength(0);
      expect(wrapper.find(TeamDetails)).toHaveLength(0);
    });

    describe('access denied because required feature is not active', () => {
      beforeEach(() => {
        actions.push({
          type: 'ACCESS_DENIED',
          payload: { reason: FEATURE_INACTIVE }
        });
      });

      it('should show placeholder with contact button', () => {
        const { wrapper } = renderComponent(actions);

        const placeholder = wrapper
          .find(Placeholder)
          .filter({ testId: 'access-denied-placeholder' });
        expect(placeholder).toHaveLength(1);
        expect(placeholder.find(ContactUsButton)).toHaveLength(1);
      });
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

      it('should have called onReady', () => {
        renderComponent(actions, onReadyMock);
        expect(onReadyMock).toHaveBeenCalled();
      });

      it('should render TeamList', () => {
        const { wrapper } = renderComponent(actions);
        expect(wrapper.find(TeamList)).toHaveLength(1);
      });
    });
  });
});
