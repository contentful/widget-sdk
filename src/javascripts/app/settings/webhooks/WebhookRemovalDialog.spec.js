import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookRemovalDialog from './WebhookRemovalDialog.es6';

describe('WebhookRemovalDialog', () => {
  const shallow = () => {
    const stubs = {
      remove: sinon.stub(),
      confirm: sinon.stub(),
      cancel: sinon.stub()
    };

    const wrapper = Enzyme.shallow(
      <WebhookRemovalDialog
        webhookUrl="http://test.com"
        remove={stubs.remove}
        confirm={stubs.confirm}
        cancel={stubs.cancel}
      />
    );

    return [wrapper, stubs];
  };

  it('renders webhook URL', () => {
    const [wrapper] = shallow();
    const text = wrapper.find('.modal-dialog__richtext').text();
    expect(text.includes('http://test.com')).toBe(true);
  });

  it('blocks remove button if already removing', () => {
    const [wrapper] = shallow();
    const isDisabled = () =>
      wrapper
        .find('button')
        .first()
        .prop('disabled');
    expect(isDisabled()).toBe(false);
    wrapper.setState({ busy: true });
    expect(isDisabled()).toBe(true);
  });

  it('confirms dialog if removed successfully', async () => {
    expect.assertions(3);
    const [wrapper, stubs] = shallow();
    stubs.remove.resolves();
    await wrapper
      .find('button')
      .first()
      .prop('onClick')();
    expect(stubs.remove.calledOnce).toBe(true);
    expect(stubs.confirm.calledOnce).toBe(true);
    expect(stubs.confirm.calledWith(undefined)).toBe(true);
  });

  it('cancels dialog with an error if removing failed', async () => {
    expect.assertions(2);
    const [wrapper, stubs] = shallow();
    const err = new Error('failed');
    stubs.remove.rejects(err);
    await wrapper
      .find('button')
      .first()
      .prop('onClick')();
    expect(stubs.remove.calledOnce).toBe(true);
    expect(stubs.cancel.calledWith(err)).toBe(true);
  });

  it('cancels dialog with no error if cancelled', async () => {
    expect.assertions(2);
    const [wrapper, stubs] = shallow();

    await wrapper
      .find('button')
      .last()
      .prop('onClick')();
    expect(stubs.cancel.calledOnce).toBe(true);
    expect(stubs.cancel.calledWith()).toBe(true);
  });
});
