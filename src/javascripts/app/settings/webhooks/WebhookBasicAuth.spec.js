import React from 'react';

import { render, fireEvent } from '@testing-library/react';
import WebhookBasicAuth from './WebhookBasicAuth';

describe('WebhookBasicAuth', () => {
  const renderComponent = user => {
    const onChangeStub = jest.fn();
    const wrapper = render(<WebhookBasicAuth httpBasicUsername={user} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  it('does not show up if credentials are not stored', () => {
    const [{ container }] = renderComponent(undefined);
    expect(container).toBeEmpty();
  });

  it('only displays username if credentials are stored', () => {
    const [{ container }] = renderComponent('jakub');
    expect(container.querySelector('strong')).toHaveTextContent('jakub');
  });

  it('allows to forget credentials if stored', () => {
    const [{ getByText }, onChangeStub] = renderComponent('jakub');

    fireEvent.click(getByText('Remove stored credentials'));
    expect(onChangeStub).toHaveBeenCalledWith({
      httpBasicPassword: null,
      httpBasicUsername: null
    });
    expect(onChangeStub).toHaveBeenCalledTimes(1);
  });
});
