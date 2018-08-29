import React from 'react';
import Enzyme from 'enzyme';

describe('WebhookListSidebar', function() {
  let WebhookListSidebar;

  const mount = (webhooks, resource = {}, organization = {}) => {
    return Enzyme.mount(
      <WebhookListSidebar webhooks={webhooks} resource={resource} organization={organization} />
    );
  };

  // We inject instead of importing so UI Router's $state is available
  beforeEach(function() {
    module('contentful/test');
    WebhookListSidebar = this.$inject('app/Webhooks/WebhookListSidebar').default;
  });

  const testText = (wrapper, expected) => {
    const text = wrapper
      .find('p')
      .first()
      .text();
    expect(text).toBe(expected);
  };

  it('uses number of fetched webhooks as the usage for v1 orgs', function() {
    const wrapper = mount([{}, {}]);
    testText(wrapper, 'Your space is using 2 webhooks.');
  });

  it('uses resource usage for v2 orgs', function() {
    const wrapper = mount([{}, {}], { usage: 3 }, { pricingVersion: 'pricing_version_2' });
    testText(wrapper, 'Your space is using 3 webhooks.');
  });

  it('shows empty message', function() {
    const wrapper = mount([]);
    testText(wrapper, "Your space isn't using any webhooks.");
  });

  it('uses singular "webhook" for one webhook', function() {
    const wrapper = mount([{}]);
    testText(wrapper, 'Your space is using 1 webhook.');
  });
});
