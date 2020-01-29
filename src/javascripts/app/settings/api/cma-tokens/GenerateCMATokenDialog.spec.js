import React from 'react';

import { render, fireEvent, waitForElement, screen, wait } from '@testing-library/react';
import GenerateCMATokenDialog from './GenerateCMATokenDialog';
import * as Analytics from 'analytics/Analytics';

describe('CMATokens/GenerateCMATokenDialog', () => {
  it('should ask user to provide token name when opened', () => {
    const stubs = {
      onCancel: jest.fn()
    };

    render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={() => {}}
        onCancel={stubs.onCancel}
        createToken={() => {}}
        successHandler={() => {}}
      />
    );

    const tokenInput = screen.getByLabelText('Token name', { exact: false });
    const generateBtn = screen.getByText('Generate');

    expect(tokenInput).toHaveFocus();
    expect(generateBtn).toBeDisabled();

    fireEvent.change(tokenInput, { target: { value: 'newToken' } });

    expect(generateBtn).not.toBeDisabled();

    fireEvent.click(screen.getByText('Close'));

    expect(stubs.onCancel).toHaveBeenCalled();
  });

  it('should show retry form if request has failed', async () => {
    const stubs = {
      onConfirm: jest.fn(),
      createToken: jest.fn().mockRejectedValue(),
      successHandler: jest.fn()
    };
    render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={stubs.onConfirm}
        onCancel={() => {}}
        createToken={stubs.createToken}
        successHandler={stubs.successHandler}
      />
    );

    fireEvent.change(screen.getByLabelText('Token name', { exact: false }), {
      target: { value: 'new token' }
    });

    fireEvent.click(screen.getByText('Generate'));

    const retryButton = await waitForElement(() => screen.getByText('Retry'));
    expect(
      screen.getByTestId('pat.create.tokenGenerationFailed').textContent
    ).toMatchInlineSnapshot(
      `"The token generation failed. We\\"ve been informed about this problem. Please retry shortly, or reach out to our support team if the problem persists."`
    );

    expect(stubs.createToken).toHaveBeenCalledWith('new token');
    expect(stubs.createToken).toHaveBeenCalledTimes(1);
    expect(stubs.successHandler).not.toHaveBeenCalled();
    expect(stubs.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(retryButton);

    expect(stubs.createToken).toHaveBeenCalledTimes(2);

    await wait();
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
    render(
      <GenerateCMATokenDialog
        isShown
        onConfirm={stubs.onConfirm}
        onCancel={() => {}}
        createToken={stubs.createToken}
        successHandler={stubs.successHandler}
      />
    );

    fireEvent.change(screen.getByLabelText('Token name', { exact: false }), {
      target: { value: 'new token' }
    });

    fireEvent.click(screen.getByText('Generate'));

    const doneButton = await waitForElement(() => screen.getByTestId('pat.create.done-button'));

    expect(stubs.createToken).toHaveBeenCalledWith('new token');
    expect(stubs.createToken).toHaveBeenCalledTimes(1);
    expect(stubs.successHandler).toHaveBeenCalled();
    expect(stubs.onConfirm).not.toHaveBeenCalled();
    expect(Analytics.track).toHaveBeenCalledWith('personal_access_token:action', {
      action: 'create',
      patId: 'new-token-id'
    });

    expect(
      screen.getByTestId('pat.create.tokenGenerationSuccess').textContent
    ).toMatchInlineSnapshot(
      `"\\"new token\\" is ready!Make sure to immediately copy your new Personal Access Token. You won\\"t be able to see it again!"`
    );

    expect(screen.getByDisplayValue('new-token-value')).toBeDisabled();

    fireEvent.click(doneButton);

    expect(stubs.onConfirm).toHaveBeenCalledWith('new-token-value');

    await wait();
  });
});
