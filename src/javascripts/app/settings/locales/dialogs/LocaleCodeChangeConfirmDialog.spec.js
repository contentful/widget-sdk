import React from 'react';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';
import LocaleCodeChangeConfirmDialog from './LocaleCodeChangeConfirmDialog.es6';

describe('locales/components/LocaleCodeChangeConfirmDialog', () => {
  const selectors = {
    repeatLocaleInput: 'input[data-test-id="repeat-locale-input"]',
    confirmChangeLocale: '[data-test-id="change-locale-confirm"]',
    cancelChangeLocale: '[data-test-id="change-locale-cancel"]',
    modalDialogClose: '[data-test-id="modal-dialog-close"]'
  };

  const renderComponent = props => (
    <LocaleCodeChangeConfirmDialog
      onConfirm={() => {}}
      onCancel={() => {}}
      locale={{
        name: 'German',
        code: 'de'
      }}
      previousLocale={{
        name: 'Russian',
        code: 'ru'
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
    expect(wrapper.find(selectors.confirmChangeLocale)).toBeDisabled();
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

    wrapper.find(selectors.cancelChangeLocale).simulate('click');
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
    wrapper.find(selectors.repeatLocaleInput).simulate('change', { target: { value: 'ru' } });
    expect(wrapper.find(selectors.confirmChangeLocale)).not.toBeDisabled();
    wrapper.find(selectors.confirmChangeLocale).simulate('click');
    wrapper
      .find(selectors.repeatLocaleInput)
      .simulate('change', { target: { value: 'something' } });
    expect(wrapper.find(selectors.confirmChangeLocale)).toBeDisabled();
    wrapper.find(selectors.confirmChangeLocale).simulate('click');

    expect(stubs.onConfirm.callCount).toBe(1);
  });
});
