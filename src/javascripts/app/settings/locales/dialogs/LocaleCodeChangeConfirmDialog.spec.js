import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import LocaleCodeChangeConfirmDialog from './LocaleCodeChangeConfirmDialog.es6';

describe('locales/components/LocaleCodeChangeConfirmDialog', () => {
  afterEach(cleanup);

  const renderComponent = props =>
    render(
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

  it('confirm button should be disabled by default', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('change-locale-confirm')).toBeDisabled();
  });

  it('it is possible to invoke cancel by clicking on two buttons', () => {
    const stubs = {
      onCancel: jest.fn()
    };
    const { getByTestId } = renderComponent({
      onCancel: stubs.onCancel
    });

    fireEvent.click(getByTestId('change-locale-cancel'));
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button should be enabled when user types locale code in input', () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn()
    };

    const { getByTestId } = renderComponent({
      ...stubs
    });

    const repeatLocaleInput = getByTestId('repeat-locale-input');
    const confirmChangeLocale = getByTestId('change-locale-confirm');

    fireEvent.change(repeatLocaleInput, { target: { value: 'ru' } });

    expect(confirmChangeLocale).not.toBeDisabled();

    fireEvent.click(confirmChangeLocale);

    fireEvent.change(repeatLocaleInput, { target: { value: 'something' } });

    expect(confirmChangeLocale).toBeDisabled();

    fireEvent.click(confirmChangeLocale);

    expect(stubs.onConfirm).toHaveBeenCalledTimes(1);
  });
});
