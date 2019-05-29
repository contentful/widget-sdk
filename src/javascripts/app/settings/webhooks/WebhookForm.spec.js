import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup, fireEvent } from 'react-testing-library';
import WebhookForm from './WebhookForm.es6';

describe('WebhookForm', () => {
  afterEach(cleanup);

  const renderComponent = () => {
    const onChangeStub = jest.fn();
    const wrapper = render(<WebhookForm webhook={{}} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  it('renders and updates details', () => {
    const [{ getByLabelText }, onChangeStub] = renderComponent();

    const name = getByLabelText('Name', { exact: false });
    const url = getByLabelText('URL', { exact: false });

    expect(name.value).toBe('');
    expect(url.value).toBe('');

    fireEvent.change(name, { target: { value: 'webhook' } });
    expect(onChangeStub).toHaveBeenCalledWith({ name: 'webhook' });

    fireEvent.change(url, { target: { value: 'http://test.com' } });
    expect(onChangeStub).toHaveBeenCalledWith({ url: 'http://test.com' });
  });

  it('renders and updates transformation properties', () => {
    const [{ getByTestId }, onChangeStub] = renderComponent();

    const method = getByTestId('webhook-method-select');
    const contentType = getByTestId('content-type-select');

    expect(method.value).toBe('POST');
    expect(contentType.value).toBe('application/vnd.contentful.management.v1+json');

    fireEvent.change(contentType, { target: { value: 'application/json' } });

    expect(onChangeStub).toHaveBeenCalledWith({
      transformation: { contentType: 'application/json' }
    });
  });
});
