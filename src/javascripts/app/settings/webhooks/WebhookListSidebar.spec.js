import React from 'react';
import 'jest-dom/extend-expect';
import { cleanup, render } from 'react-testing-library';
import WebhookListSidebar from './WebhookListSidebar.es6';

describe('WebhookListSidebar', () => {
  afterEach(cleanup);

  const renderWithCount = count => {
    return render(<WebhookListSidebar webhookCount={count} openTemplateDialog={() => {}} />);
  };

  it('shows empty message', () => {
    const { container } = renderWithCount(0);
    expect(container).toHaveTextContent("Your space isn't using any webhooks.");
  });

  it('uses singular "webhook" for one webhook', () => {
    const { container } = renderWithCount(1);
    expect(container).toHaveTextContent('Your space is using 1 webhook.');
  });

  it('uses plural "webhooks" for many webhooks', () => {
    const { container } = renderWithCount(2);
    expect(container).toHaveTextContent('Your space is using 2 webhooks.');
  });
});
