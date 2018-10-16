import React from 'react';
import Enzyme from 'enzyme';
import WebhookListSidebar from './WebhookListSidebar.es6';

describe('WebhookListSidebar', () => {
  const mount = count => {
    return Enzyme.mount(<WebhookListSidebar webhookCount={count} openTemplateDialog={() => {}} />);
  };

  const testText = (wrapper, expected) => {
    const text = wrapper
      .find('p')
      .first()
      .text();
    expect(text).toBe(expected);
  };

  it('shows empty message', () => {
    testText(mount(0), "Your space isn't using any webhooks.");
  });

  it('uses singular "webhook" for one webhook', () => {
    testText(mount(1), 'Your space is using 1 webhook.');
  });

  it('uses plural "webhooks" for many webhooks', () => {
    testText(mount(2), 'Your space is using 2 webhooks.');
  });
});
