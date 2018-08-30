import React from 'react';
import Enzyme from 'enzyme';
import WebhookRemovalDialog from 'app/Webhooks/WebhookRemovalDialog.es6';

describe('WebhookRemovalDialog', function() {
  const mount = () => {
    const stubs = {
      remove: sinon.stub(),
      confirm: sinon.stub(),
      cancel: sinon.stub()
    };

    const wrapper = Enzyme.mount(
      <WebhookRemovalDialog
        webhookUrl="http://test.com"
        remove={stubs.remove}
        confirm={stubs.confirm}
        cancel={stubs.cancel}
      />
    );

    return [wrapper, stubs];
  };

  it('renders webhook URL', function() {
    const [wrapper] = mount();
    const text = wrapper.find('.modal-dialog__richtext').text();
    expect(text.includes('http://test.com')).toBe(true);
  });

  it('blocks remove button if already removing', function() {
    const [wrapper] = mount();
    const isDisabled = () =>
      wrapper
        .find('button')
        .first()
        .prop('disabled');
    expect(isDisabled()).toBe(false);
    wrapper.setState({ busy: true });
    expect(isDisabled()).toBe(true);
  });

  it('confirms dialog if removed successfully', async function() {
    const [wrapper, stubs] = mount();
    stubs.remove.resolves();
    await wrapper
      .find('button')
      .first()
      .prop('onClick')();
    sinon.assert.calledOnce(stubs.remove);
    sinon.assert.calledOnce(stubs.confirm);
    sinon.assert.calledWith(stubs.confirm);
  });

  it('cancels dialog with an error if removing failed', async function() {
    const [wrapper, stubs] = mount();
    const err = new Error('failed');
    stubs.remove.rejects(err);
    await wrapper
      .find('button')
      .first()
      .prop('onClick')();
    sinon.assert.calledOnce(stubs.remove);
    sinon.assert.calledWith(stubs.cancel, err);
  });

  it('cancels dialog with no error if cancelled', async function() {
    const [wrapper, stubs] = mount();

    await wrapper
      .find('button')
      .last()
      .prop('onClick')();
    sinon.assert.calledOnce(stubs.cancel);
    sinon.assert.calledWith(stubs.cancel);
  });
});
