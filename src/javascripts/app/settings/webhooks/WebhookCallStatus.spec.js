import React from 'react';
import 'jest-dom/extend-expect';
import { cleanup, render } from 'react-testing-library';
import WebhookCallStatus from './WebhookCallStatus.es6';

describe('WebhookCallStatus', () => {
  afterEach(cleanup);

  const renderComponent = (code, error) => {
    const call = { errors: error ? [error] : undefined, statusCode: code };
    return render(<WebhookCallStatus call={call} />);
  };

  const testStatus = (elem, expected) => {
    expect(elem).toHaveAttribute('data-status', expected);
  };

  it('shows green light when code < 300', () => {
    const { getByTestId } = renderComponent(200);
    testStatus(getByTestId('status-indicator'), 'success');
  });

  it('shows yellow light when code >= 300 and code < 400', () => {
    const { getByTestId } = renderComponent(301);
    testStatus(getByTestId('status-indicator'), 'warning');
  });

  it('shows red light if code >= 400', () => {
    const { getByTestId } = renderComponent(500);
    testStatus(getByTestId('status-indicator'), 'failure');
  });

  it('shows red light if has both invalid code and some error', () => {
    const { getByTestId } = renderComponent(400, 'TimeoutError');
    testStatus(getByTestId('status-indicator'), 'failure');
  });

  it('shows a label for errors', () => {
    const { container } = renderComponent(undefined, 'TimeoutError');
    expect(container).toHaveTextContent('Timeout');
  });

  it('shows a status code when available', () => {
    const { container } = renderComponent(200);
    expect(container).toHaveTextContent('HTTP 200');
  });

  it('shows a generic error label if unknown', () => {
    const { container } = renderComponent(undefined, 'BlahBlahError');
    expect(container).toHaveTextContent('Unknown error');
  });
});
