import React from 'react';
import Enzyme from 'enzyme';
import { noop } from 'lodash';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from 'redux/reducer/index.es6';
import routes from 'redux/routes.es6';

import SpaceSettings from './SpaceSettings.es6';

const activeOrgId = 'testOrgId';
let store;
describe('SpaceSettings', () => {
  const selectors = {
    idInput: 'input[name="space-id"]',
    nameInput: 'input[name="space-name"]',
    saveBtn: 'button[data-test-id="update-space"]',
    deleteBtn: 'button[data-test-id="delete-space"]'
  };

  beforeEach(() => {
    store = createStore(reducer);
    store.dispatch({
      type: 'LOCATION_CHANGED',
      payload: {
        location: {
          pathname: routes.organization.build({ orgId: activeOrgId })
        }
      }
    });
    store.dispatch({
      type: 'USER_UPDATE_FROM_TOKEN',
      payload: {
        user: {
          organizationMemberships: [
            {
              organization: {
                sys: {
                  id: activeOrgId
                }
              },
              role: 'owner'
            }
          ]
        }
      }
    });
  });

  const mount = props => {
    return Enzyme.mount(
      <Provider store={store}>
        <SpaceSettings
          spaceName="test-name"
          spaceId="test-id"
          onRemoveClick={noop}
          save={noop}
          {...props}
        />
      </Provider>
    );
  };

  it('correct space data is present in the form', () => {
    const wrapper = mount();
    const $idInput = wrapper.find(selectors.idInput);
    const $nameInput = wrapper.find(selectors.nameInput);
    expect($idInput.prop('value')).toBe('test-id');
    expect($nameInput.prop('value')).toBe('test-name');
  });

  it('save button is disabled by default', () => {
    const wrapper = mount();
    expect(wrapper.find(selectors.saveBtn)).toBeDisabled();
  });

  it('save button is enabled if name was changed, but disabled when it is empty', () => {
    const wrapper = mount();
    const $nameInput = wrapper.find(selectors.nameInput);
    $nameInput.simulate('change', {
      target: { value: 'new-value' }
    });
    expect(wrapper.find(selectors.saveBtn)).not.toBeDisabled();
    $nameInput.simulate('change', {
      target: { value: '' }
    });
    expect(wrapper.find(selectors.saveBtn)).toBeDisabled();
  });

  it('save is called when user clicks on save and double click is handled', () => {
    const saveStub = jest.fn().mockResolvedValue();
    const wrapper = mount({
      save: saveStub
    });
    wrapper.find(selectors.nameInput).simulate('change', { target: { value: 'new-value' } });
    wrapper.find(selectors.saveBtn).simulate('click');
    // try double click
    wrapper.find(selectors.saveBtn).simulate('click');
    expect(saveStub).toHaveBeenCalledTimes(1);
    expect(saveStub).toHaveBeenCalledWith('new-value');
  });

  it('save is not called when user clicks on disable button', () => {
    const saveStub = jest.fn().mockResolvedValue();
    const wrapper = mount({
      save: saveStub
    });
    wrapper.find(selectors.nameInput).simulate('change', { target: { value: '' } });
    wrapper.find(selectors.saveBtn).simulate('click');
    expect(saveStub).not.toHaveBeenCalled();
  });
});
