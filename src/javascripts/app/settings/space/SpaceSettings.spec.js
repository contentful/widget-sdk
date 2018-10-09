import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import { noop } from 'lodash';

import SpaceSettings from './SpaceSettings.es6';

describe('SpaceSettings', () => {
  const selectors = {
    idInput: 'input[name="space-id"]',
    nameInput: 'input[name="space-name"]',
    saveBtn: 'button[data-test-id="update-space"]',
    deleteBtn: 'button[data-test-id="delete-space"]'
  };

  const mount = props => {
    return Enzyme.mount(
      <SpaceSettings
        spaceName="test-name"
        spaceId="test-id"
        onRemoveClick={noop}
        save={noop}
        {...props}
      />
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
    const saveStub = sinon.stub().resolves();
    const wrapper = mount({
      save: saveStub
    });
    wrapper.find(selectors.nameInput).simulate('change', { target: { value: 'new-value' } });
    wrapper.find(selectors.saveBtn).simulate('click');
    // try double click
    wrapper.find(selectors.saveBtn).simulate('click');
    expect(saveStub.calledOnce).toBeTruthy();
    expect(saveStub.calledWith('new-value')).toBeTruthy();
  });

  it('save is not called when user clicks on disable button', () => {
    const saveStub = sinon.stub().resolves();
    const wrapper = mount({
      save: saveStub
    });
    wrapper.find(selectors.nameInput).simulate('change', { target: { value: '' } });
    wrapper.find(selectors.saveBtn).simulate('click');
    expect(saveStub.notCalled).toBeTruthy();
  });
});
