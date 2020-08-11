import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestConnection } from './TestConnection';
import { formatConnectionTestErrors } from 'app/OrganizationSettings/SSO/utils';

const orgId = '123';
const onCompleteCb = jest.fn();

jest.useFakeTimers('modern');

jest.mock('app/OrganizationSettings/SSO/utils', () => ({
  formatConnectionTestErrors: jest.fn(() => ['foo', 'bar']),
}));

describe('TestConnection', () => {
  let windowMock;

  beforeEach(() => {
    global.open = jest.fn(() => windowMock);

    windowMock = { closed: false, close: jest.fn() };
  });

  it('tests the connection successfully', async () => {
    render(<TestConnection orgId={orgId} disabled={false} onComplete={onCompleteCb} />);

    const submitBtn = screen.getByTestId('test-idp-connection.submit');

    fireEvent.click(submitBtn);

    expect(global.open).toHaveBeenCalledWith(
      'https://be.contentful.com/sso/123/test_connection',
      '',
      expect.any(String)
    );
    expect(submitBtn.textContent).toMatch(/Testing connection/);

    windowMock.closed = true;

    jest.runOnlyPendingTimers();

    await waitFor(() => expect(onCompleteCb).toHaveBeenCalled());
  });

  it('cancels the test run', () => {
    render(<TestConnection orgId={orgId} disabled={false} onComplete={onCompleteCb} />);
    const submitBtn = screen.getByTestId('test-idp-connection.submit');
    fireEvent.click(submitBtn);

    const cancelBtn = screen.getByTestId('test-idp-connection.cancel');
    fireEvent.click(cancelBtn);

    expect(onCompleteCb).not.toHaveBeenCalled();
    expect(windowMock.close).toHaveBeenCalled();
    expect(submitBtn.textContent).toMatch(/Test connection/);
  });

  it('displays a success message', () => {
    const config = {
      testConnectionResult: 'success',
    };
    render(
      <TestConnection orgId={orgId} disabled={false} onComplete={onCompleteCb} ssoConfig={config} />
    );
    const submitBtn = screen.getByTestId('test-idp-connection.submit');
    expect(submitBtn.textContent).toMatch(/Retest connection/);
    expect(screen.getByTestId('test-idp-connection.result.success')).toBeVisible();
  });

  it('displays a message about an unknown problem', () => {
    const config = {
      testConnectionAt: '2020-08-06T08:54:53.181Z',
    };

    render(
      <TestConnection orgId={orgId} disabled={false} onComplete={onCompleteCb} ssoConfig={config} />
    );
    const submitBtn = screen.getByTestId('test-idp-connection.submit');
    expect(submitBtn.textContent).toMatch(/Test connection/);
    expect(screen.getByTestId('test-idp-connection.result.unknown')).toBeVisible();
  });

  it('displays failure message', () => {
    const config = {
      testConnectionResult: 'failure',
      errors: ['foo, bar'],
    };
    render(
      <TestConnection orgId={orgId} disabled={false} onComplete={onCompleteCb} ssoConfig={config} />
    );

    const submitBtn = screen.getByTestId('test-idp-connection.submit');
    expect(submitBtn.textContent).toMatch(/Test connection/);
    expect(screen.getByTestId('test-idp-connection.result.failure')).toBeVisible();
    expect(formatConnectionTestErrors).toHaveBeenCalledWith(config.errors);
  });
});
