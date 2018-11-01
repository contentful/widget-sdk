import React from 'react';
import { shallow, mount } from 'enzyme';
import ChooseNewFallbackLocaleDialog from './ChooseNewFallbackLocaleDialog.es6';

describe('locales/components/ChooseNewFallbackLocaleDialog', () => {
  const selectors = {
    confirmChangeLocale: '[data-test-id="choose-locale-confirm"]',
    cancelChangeLocale: '[data-test-id="choose-locale-cancel"]',
    modalDialogClose: '[data-test-id="modal-dialog-close"]',
    chooseLocaleSelect: '[data-test-id="choose-fallback-locale-select"]'
  };

  const renderComponent = props => (
    <ChooseNewFallbackLocaleDialog
      onConfirm={() => {}}
      onCancel={() => {}}
      locale={{
        name: 'German',
        code: 'de'
      }}
      dependantLocaleNames="pl, fr, zh"
      availableLocales={[
        {
          name: 'Russian',
          code: 'ru'
        },
        {
          name: 'English',
          code: 'en'
        }
      ]}
      {...props}
    />
  );

  it('should match snapshot', () => {
    const wrapper = shallow(renderComponent());
    expect(wrapper).toMatchSnapshot();
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
    wrapper.find(selectors.modalDialogClose).simulate('click');
    expect(stubs.onCancel).toHaveBeenCalledTimes(2);
  });

  it('click on submit sends current selected code to the callback', () => {
    const stubs = {
      onConfirm: jest.fn()
    };
    const wrapper = mount(
      renderComponent({
        onConfirm: stubs.onConfirm
      })
    );
    // click with 'none' selected
    wrapper.find(selectors.confirmChangeLocale).simulate('click');
    expect(stubs.onConfirm).toHaveBeenCalledWith('');
    // select 'en' and click again
    wrapper.find(selectors.chooseLocaleSelect).simulate('change', { target: { value: 'en' } });
    wrapper.find(selectors.confirmChangeLocale).simulate('click');
    expect(stubs.onConfirm).toHaveBeenCalledWith('en');
    expect(stubs.onConfirm).toHaveBeenCalledTimes(2);
  });
});
