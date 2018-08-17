import React from 'react';
import Enzyme from 'enzyme';
import { noop } from 'lodash';

describe('app/SpaceSettings/GeneralSettings', () => {
  let SpaceSettingsContainer;

  const mount = (props = {}) => {
    return Enzyme.mount(
      <SpaceSettingsContainer
        getSpace={() => ({
          data: {
            name: 'test-name',
            sys: {
              version: 1
            }
          },
          getId: () => 'test-id'
        })}
        renameSpace={noop}
        getSpacePlan={noop}
        openDeleteSpaceDialog={noop}
        {...props}
      />
    );
  };

  const selectors = {
    idInput: 'input[name="space-id"]',
    nameInput: 'input[name="space-name"]',
    saveBtn: 'button[data-test-id="update-space"]',
    deleteBtn: 'button[data-test-id="delete-space"]'
  };

  beforeEach(function () {
    module('contentful/test');
    SpaceSettingsContainer = this.$inject(
      'app/SpaceSettings/GeneralSettings/SpaceSettingsContainer'
    ).default;
  });

  it('correct space data is present in the form', () => {
    const wrapper = mount();
    const $idInput = wrapper.find(selectors.idInput);
    const $nameInput = wrapper.find(selectors.nameInput);
    expect($idInput.prop('value')).toBe('test-id');
    expect($nameInput.prop('value')).toBe('test-name');
  });

  it('save button is disabled by default', () => {
    const wrapper = mount();
    expect(wrapper.find(selectors.saveBtn).prop('disabled')).toBe(true);
  });

  it('save button is enabled if name was changed, but disabled when it is empty', () => {
    const wrapper = mount();
    const $nameInput = wrapper.find(selectors.nameInput);
    $nameInput.simulate('change', {
      target: { value: 'new-value' }
    });
    expect(wrapper.find(selectors.saveBtn).prop('disabled')).toBe(false);
    $nameInput.simulate('change', {
      target: { value: '' }
    });
    expect(wrapper.find(selectors.saveBtn).prop('disabled')).toBe(true);
  });

  it('renameSpace is called when user clicks on save', () => {
    const renameSpaceStub = sinon.stub().resolves();
    const wrapper = mount({
      renameSpace: renameSpaceStub
    });
    wrapper
      .find(selectors.nameInput)
      .simulate('change', { target: { value: 'new-value' } });
    wrapper.find(selectors.saveBtn).simulate('click');
    // try double click
    wrapper.find(selectors.saveBtn).simulate('click');
    sinon.assert.calledOnce(renameSpaceStub);
    sinon.assert.calledWith(renameSpaceStub, 'new-value', 1);
  });
});
