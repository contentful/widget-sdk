import React from 'react';
import { shallow } from 'enzyme';
import WebhookRemovalDialog from './WebhookRemovalDialog.es6';

describe('webhooks/dialogs/WebhookRemovalDialog', () => {
  it('should match snapshot', () => {
    const wrapper = shallow(
      <WebhookRemovalDialog
        isShown
        isConfirmLoading={false}
        onCancel={() => {}}
        onConfirm={() => {}}
        webhookUrl="https://test.com"
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
