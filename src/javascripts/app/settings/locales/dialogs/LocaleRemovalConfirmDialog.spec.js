import React from 'react';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';
import LocaleRemovalConfirmDialog from './LocaleRemovalConfirmDialog.es6';

describe('locales/components/LocaleRemovalConfirmDialog', () => {
  const selectors = {
    repeatLocaleInput: 'input[data-test-id="repeat-locale-input"]',
    confirmDeleteLocale: '[data-test-id="delete-locale-confirm"]',
    cancelDeleteLocale: '[data-test-id="delete-locale-cancel"]',
    modalDialogClose: '[data-test-id="modal-dialog-close"]'
  };

  const renderComponent = props => (
    <LocaleRemovalConfirmDialog
      onConfirm={() => {}}
      onCancel={() => {}}
      locale={{
        name: 'English',
        code: 'uk'
      }}
      {...props}
    />
  );

  it('should match snapshot', () => {
    const wrapper = shallow(renderComponent());
    expect(wrapper).toMatchSnapshot();
  });

  it('confirm button should be disabled by default', () => {
    const wrapper = mount(renderComponent());
    expect(wrapper.find(selectors.confirmDeleteLocale)).toBeDisabled();
  });

  it('it is possible to invoke cancel by clicking on two buttons', () => {
    const stubs = {
      onCancel: sinon.stub()
    };
    const wrapper = mount(
      renderComponent({
        onCancel: stubs.onCancel
      })
    );

    wrapper.find(selectors.cancelDeleteLocale).simulate('click');
    wrapper.find(selectors.modalDialogClose).simulate('click');
    expect(stubs.onCancel.callCount).toBe(2);
  });

  it('confirm button should be enabled when user types locale code in input', () => {
    const stubs = {
      onConfirm: sinon.stub(),
      onCancel: sinon.stub()
    };

    const wrapper = mount(
      renderComponent({
        ...stubs
      })
    );
    wrapper.find(selectors.repeatLocaleInput).simulate('change', { target: { value: 'uk' } });
    expect(wrapper.find(selectors.confirmDeleteLocale)).not.toBeDisabled();
    wrapper.find(selectors.confirmDeleteLocale).simulate('click');
    wrapper
      .find(selectors.repeatLocaleInput)
      .simulate('change', { target: { value: 'something' } });
    expect(wrapper.find(selectors.confirmDeleteLocale)).toBeDisabled();
    wrapper.find(selectors.confirmDeleteLocale).simulate('click');

    expect(stubs.onConfirm.callCount).toBe(1);
  });
});
