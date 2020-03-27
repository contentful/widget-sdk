import React from 'react';

import { render, fireEvent } from '@testing-library/react';
import ChooseNewFallbackLocaleDialog from './ChooseNewFallbackLocaleDialog';

describe('locales/components/ChooseNewFallbackLocaleDialog', () => {
  const renderComponent = (props) =>
    render(
      <ChooseNewFallbackLocaleDialog
        isShown
        onConfirm={() => {}}
        onCancel={() => {}}
        locale={{
          name: 'German',
          code: 'de',
        }}
        dependantLocales={[
          {
            name: 'Polish',
            code: 'pl',
          },
          {
            name: 'French',
            code: 'fr',
          },
        ]}
        availableLocales={[
          {
            name: 'Russian',
            code: 'ru',
          },
          {
            name: 'English',
            code: 'en',
          },
        ]}
        {...props}
      />
    );

  it('it is possible to invoke cancel by clicking on two buttons', () => {
    const stubs = {
      onCancel: jest.fn(),
    };
    const { getByTestId } = renderComponent({
      onCancel: stubs.onCancel,
    });

    fireEvent.click(getByTestId('choose-locale-cancel'));
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('click on submit sends current selected code to the callback', () => {
    const stubs = {
      onConfirm: jest.fn(),
    };
    const { getByTestId } = renderComponent({
      onConfirm: stubs.onConfirm,
    });

    const confirmChangeLocale = getByTestId('choose-locale-confirm');
    const chooseLocaleSelect = getByTestId('choose-fallback-locale-select');

    // click with 'none' selected
    fireEvent.click(confirmChangeLocale);
    expect(stubs.onConfirm).toHaveBeenCalledWith('');
    // select 'en' and click again
    fireEvent.change(chooseLocaleSelect, { target: { value: 'en' } });
    fireEvent.click(confirmChangeLocale);
    expect(stubs.onConfirm).toHaveBeenCalledWith('en');
    expect(stubs.onConfirm).toHaveBeenCalledTimes(2);
  });
});
