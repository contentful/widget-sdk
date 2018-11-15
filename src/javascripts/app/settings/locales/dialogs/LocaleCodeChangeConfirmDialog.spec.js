import React from 'react';
import { shallow, mount } from 'enzyme';
import LocaleCodeChangeConfirmDialog from './LocaleCodeChangeConfirmDialog.es6';

describe('locales/components/LocaleCodeChangeConfirmDialog', () => {
  const selectors = {
    repeatLocaleInput: 'input[data-test-id="repeat-locale-input"]',
    confirmChangeLocale: '[data-test-id="change-locale-confirm"]',
    cancelChangeLocale: '[data-test-id="change-locale-cancel"]'
  };

  const renderComponent = props => (
    <LocaleCodeChangeConfirmDialog
      isShown
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
      onCancel: jest.fn()
    };
    const wrapper = mount(
      renderComponent({
        onCancel: stubs.onCancel
      })
    );

    wrapper.find(selectors.cancelChangeLocale).simulate('click');
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button should be enabled when user types locale code in input', () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn()
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

    expect(stubs.onConfirm).toHaveBeenCalledTimes(1);
  });
});
