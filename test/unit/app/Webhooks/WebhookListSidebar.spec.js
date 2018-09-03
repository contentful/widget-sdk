import React from 'react';
import Enzyme from 'enzyme';

describe('WebhookListSidebar', function() {
  let WebhookListSidebar;

  const mount = webhooks => {
    return Enzyme.mount(
      <WebhookListSidebar
        webhooks={webhooks}
        webhookRepo={{}}
        templateContentTypes={[]}
        openTemplateDialog={() => {}}
      />
    );
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
    const wrapper = mount([]);
    testText(wrapper, "Your space isn't using any webhooks.");
  });

  it('uses singular "webhook" for one webhook', function() {
    const wrapper = mount([{}]);
    testText(wrapper, 'Your space is using 1 webhook.');
  });

  it('uses plural "webhooks" for many webhooks', function() {
    const wrapper = mount([{}, {}]);
    testText(wrapper, 'Your space is using 2 webhooks.');
  });
});
