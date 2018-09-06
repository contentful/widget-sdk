import React from 'react';
import Enzyme from 'enzyme';

describe('WebhookListSidebar', function() {
  let WebhookListSidebar;

  const mount = count => {
    return Enzyme.mount(<WebhookListSidebar webhookCount={count} openTemplateDialog={() => {}} />);
  };

  // We inject instead of importing so UI Router's $state is available
  beforeEach(function() {
    module('contentful/test');
    WebhookListSidebar = this.$inject('app/Webhooks/WebhookListSidebar.es6').default;
  });

  const testText = (wrapper, expected) => {
    const text = wrapper
      .find('p')
      .first()
      .text();
    expect(text).toBe(expected);
  };

  it('shows empty message', function() {
    testText(mount(0), "Your space isn't using any webhooks.");
  });

  it('uses singular "webhook" for one webhook', function() {
    testText(mount(1), 'Your space is using 1 webhook.');
  });

  it('uses plural "webhooks" for many webhooks', function() {
    testText(mount(2), 'Your space is using 2 webhooks.');
  });
});
