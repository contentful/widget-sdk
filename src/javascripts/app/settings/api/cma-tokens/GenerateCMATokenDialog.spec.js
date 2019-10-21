import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent, cleanup, waitForElement } from '@testing-library/react';
import GenerateCMATokenDialog from './GenerateCMATokenDialog';
import * as Analytics from 'analytics/Analytics';

describe('CMATokens/GenerateCMATokenDialog', () => {
  afterEach(cleanup);

  it('should ask user to provide token name when opened', () => {
    const stubs = {
      onCancel: jest.fn()
    };

    const { getByLabelText, getByText } = render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={() => {}}
        onCancel={stubs.onCancel}
        createToken={() => {}}
        successHandler={() => {}}
      />
    );

    const tokenInput = getByLabelText('Token name', { exact: false });
    const generateBtn = getByText('Generate');

    expect(tokenInput).toHaveFocus();
    expect(generateBtn).toBeDisabled();

    fireEvent.change(tokenInput, { target: { value: 'newToken' } });

    expect(generateBtn).not.toBeDisabled();

    fireEvent.click(getByText('Close'));

    expect(stubs.onCancel).toHaveBeenCalled();
  });

  it('should show retry form if request has failed', async () => {
    const stubs = {
      onConfirm: jest.fn(),
      createToken: jest.fn().mockRejectedValue(),
      successHandler: jest.fn()
    };
    const { getByLabelText, getByText, getByTestId } = render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={stubs.onConfirm}
        onCancel={() => {}}
        createToken={stubs.createToken}
        successHandler={stubs.successHandler}
      />
    );

    fireEvent.change(getByLabelText('Token name', { exact: false }), {
      target: { value: 'new token' }
    });

    fireEvent.click(getByText('Generate'));

    const retryButton = await waitForElement(() => getByText('Retry'));
    expect(getByTestId('pat.create.tokenGenerationFailed').textContent).toMatchInlineSnapshot(
      `"The token generation failed. We\\"ve been informed about this problem. Please retry shortly, or reach out to our support team if the problem persists."`
    );

    expect(stubs.createToken).toHaveBeenCalledWith('new token');
    expect(stubs.createToken).toHaveBeenCalledTimes(1);
    expect(stubs.successHandler).not.toHaveBeenCalled();
    expect(stubs.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(retryButton);

    expect(stubs.createToken).toHaveBeenCalledTimes(2);
  });

  it('should show copy token input if request was successful', async () => {
    const stubs = {
      onConfirm: jest.fn(),
      createToken: jest.fn().mockResolvedValue({
        sys: { id: 'new-token-id' },
        token: 'new-token-value'
      }),
      successHandler: jest.fn()
    };
    const { getByLabelText, getByText, getByTestId, getByDisplayValue } = render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={stubs.onConfirm}
        onCancel={() => {}}
        createToken={stubs.createToken}
        successHandler={stubs.successHandler}
      />
    );

    fireEvent.change(getByLabelText('Token name', { exact: false }), {
      target: { value: 'new token' }
    });

    fireEvent.click(getByText('Generate'));

    const doneButton = await waitForElement(() => getByTestId('pat.create.done-button'));

    expect(stubs.createToken).toHaveBeenCalledWith('new token');
    expect(stubs.createToken).toHaveBeenCalledTimes(1);
    expect(stubs.successHandler).toHaveBeenCalled();
    expect(stubs.onConfirm).not.toHaveBeenCalled();
    expect(Analytics.track).toHaveBeenCalledWith('personal_access_token:action', {
      action: 'create',
      patId: 'new-token-id'
    });

    expect(getByTestId('pat.create.tokenGenerationSuccess').textContent).toMatchInlineSnapshot(
      `"\\"new token\\" is ready!Make sure to immediately copy your new Personal Access Token. You won\\"t be able to see it again!"`
    );

    expect(getByDisplayValue('new-token-value')).toBeDisabled();

    fireEvent.click(doneButton);

    expect(stubs.onConfirm).toHaveBeenCalledWith('new-token-value');
  });
});
