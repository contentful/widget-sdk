import React from 'react';
import { mount } from 'enzyme';
import { noop } from 'lodash';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from 'redux/reducer/index.es6';
import ROUTES from 'redux/routes.es6';
import { TEAMS, TEAM_MEMBERSHIPS } from 'redux/datasets.es6';
import { Button, Modal, TextField } from '@contentful/forma-36-react-components';

import TeamDialog from './TeamDialog.es6';

const renderComponent = (actions, props) => {
  const store = createStore(reducer);
  store.dispatch = jest.fn(store.dispatch);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamDialog {...props} />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrg';

const getNameField = wrapper => wrapper.find(TextField).filter({ id: 'team_name' });
const getDescriptionField = wrapper => wrapper.find(TextField).filter({ id: 'team_description' });

describe('TeamDialog', () => {
  let actions;
  let props;
  beforeEach(() => {
    actions = [];
    props = { onClose: jest.fn(noop) };
  });
  describe('an org is selected', () => {
    beforeEach(() => {
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: {
          location: { pathname: ROUTES.organization.build({ orgId: activeOrgId }) }
        }
      });
    });

    describe('is not shown', () => {
      beforeEach(() => {
        props.isShown = false;
      });

      it('should not show Modal', () => {
        const { wrapper } = renderComponent(actions, props);

        expect(wrapper.find(Modal).props()).toHaveProperty('isShown', false);
      });
    });

    describe('is shown, with other teams existing', () => {
      beforeEach(() => {
        props.isShown = true;
        actions.push({
          type: 'DATASET_LOADING',
          meta: { fetched: 100 },
          payload: {
            datasets: {
              [TEAMS]: [
                {
                  name: 'A Team',
                  sys: {
                    type: 'Team',
                    id: 'aTeam'
                  }
                },
                {
                  name: 'B Team',
                  sys: {
                    type: 'Team',
                    id: 'bTeam'
                  }
                }
              ],
              [TEAM_MEMBERSHIPS]: []
            }
          }
        });
      });

      it('should show Modal', () => {
        const { wrapper } = renderComponent(actions, props);

        expect(wrapper.find(Modal).props()).toHaveProperty('isShown', true);
      });

      it('closing the modal should close the dialog', () => {
        const { wrapper } = renderComponent(actions, props);
        wrapper
          .find(Modal.Header)
          .props()
          .onClose();

        expect(props.onClose).toHaveBeenCalled();
      });

      it('clicking cancel should close the dialog', () => {
        const { wrapper } = renderComponent(actions, props);
        wrapper
          .find(Button)
          .filter({ testId: 'close-team-dialog-button' })
          .simulate('click');

        expect(props.onClose).toHaveBeenCalled();
      });

      describe('no initial team given', () => {
        it('should be in create mode', () => {
          const { wrapper } = renderComponent(actions, props);

          expect(wrapper.find(Modal.Header).props()).toHaveProperty('title', 'New team');
          expect(getNameField(wrapper).props()).toHaveProperty('value', '');
          expect(getDescriptionField(wrapper).props()).toHaveProperty('value', '');
        });

        it('without name, should deny saving', () => {
          const { wrapper } = renderComponent(actions, props);
          getDescriptionField(wrapper)
            .find('textarea')
            .simulate('change', { target: { value: 'test desc' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).not.toHaveBeenCalled();
          expect(getNameField(wrapper).props()).toHaveProperty(
            'validationMessage',
            'Choose a name for your new team'
          );
        });

        it('if existing name is entered, should deny saving (ignoring whitespace)', () => {
          const { wrapper } = renderComponent(actions, props);

          getNameField(wrapper)
            .find('input')
            .simulate('change', { target: { value: '    A Team    ' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).not.toHaveBeenCalled();
          expect(getNameField(wrapper).props()).toHaveProperty(
            'validationMessage',
            'This name is already in use'
          );
        });

        it('if new name is entered, should accept saving', () => {
          const { wrapper, store } = renderComponent(actions, props);

          getNameField(wrapper)
            .find('input')
            .simulate('change', { target: { value: 'C Team' } });
          getDescriptionField(wrapper)
            .find('textarea')
            .simulate('change', { target: { value: 'test desc' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).toHaveBeenCalled();
          expect(store.dispatch).toHaveBeenCalledWith({
            type: 'CREATE_NEW_TEAM',
            payload: { team: { name: 'C Team', description: 'test desc' } }
          });
        });
      });

      describe('initial team given', () => {
        beforeEach(() => {
          props.initialTeam = {
            name: 'A Team',
            description: 'a description',
            sys: { id: 'aTeam' }
          };
        });

        it('should be in edit mode', () => {
          const { wrapper } = renderComponent(actions, props);

          expect(wrapper.find(Modal.Header).props()).toHaveProperty('title', 'Edit team');
        });

        it('if name is removed, should deny saving', () => {
          const { wrapper } = renderComponent(actions, props);

          getNameField(wrapper)
            .find('input')
            .simulate('change', { target: { value: '' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).not.toHaveBeenCalled();
          expect(getNameField(wrapper).props()).toHaveProperty(
            'validationMessage',
            'Choose a name for your new team'
          );
        });

        it('if existing name is entered, should deny saving (ignoring whitespace)', () => {
          const { wrapper } = renderComponent(actions, props);
          const getNameField = () => wrapper.find(TextField).filter({ id: 'team_name' });

          getNameField()
            .find('input')
            .simulate('change', { target: { value: '    B Team    ' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).not.toHaveBeenCalled();
          expect(getNameField().props()).toHaveProperty(
            'validationMessage',
            'This name is already in use'
          );
        });

        it('if new name is entered, should accept saving', () => {
          const { wrapper, store } = renderComponent(actions, props);

          getNameField(wrapper)
            .find('input')
            .simulate('change', { target: { value: 'C Team' } });
          getDescriptionField(wrapper)
            .find('textarea')
            .simulate('change', { target: { value: 'test desc 2' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).toHaveBeenCalled();
          expect(store.dispatch).toHaveBeenCalledWith({
            type: 'EDIT_TEAM_CONFIRMED',
            payload: { id: 'aTeam', changeSet: { name: 'C Team', description: 'test desc 2' } }
          });
        });

        it('if its own name is entered, should accept saving', () => {
          const { wrapper, store } = renderComponent(actions, props);

          getNameField(wrapper)
            .find('input')
            .simulate('change', { target: { value: 'A Team' } });
          getDescriptionField(wrapper)
            .find('textarea')
            .simulate('change', { target: { value: 'test desc 2' } });
          wrapper.find('form[data-test-id="team-form"]').simulate('submit');

          expect(props.onClose).toHaveBeenCalled();
          expect(store.dispatch).toHaveBeenCalledWith({
            type: 'EDIT_TEAM_CONFIRMED',
            payload: { id: 'aTeam', changeSet: { name: 'A Team', description: 'test desc 2' } }
          });
        });
      });
    });
  });
});
