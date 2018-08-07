import React from 'react';
import Enzyme from 'enzyme';
import WebhookFormSection from 'app/Webhooks/WebhookFormSection';

describe('WebhookFormSection', function () {
  const mount = (title, collapsible) => Enzyme.mount(
    <WebhookFormSection title={title} collapsible={collapsible}>
      <div id="test">TEST</div>
    </WebhookFormSection>
  );

  it('renders a non-collapsible section without a toggle', function () {
    const wrapper = mount('my title', false);
    expect(wrapper.find('h3').text()).toBe('my title');
    expect(wrapper.find('button').length).toBe(0);
    expect(wrapper.find('#test').length).toBe(1);
  });

  it('renders a collapsible section with a toggle visible by default', function () {
    const wrapper = mount('test', true);
    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('#test').length).toBe(1);
  });

  it('hides/shows children when clicking on a toggle', function () {
    const wrapper = mount('test', true);

    const toggle = () => wrapper.find('button').first().simulate('click');
    const assertVisible = isVisible => expect(wrapper.find('#test').length).toBe(isVisible ? 1 : 0);

    assertVisible(true);
    toggle();
    assertVisible(false);
    toggle();
    assertVisible(true);
  });
});
