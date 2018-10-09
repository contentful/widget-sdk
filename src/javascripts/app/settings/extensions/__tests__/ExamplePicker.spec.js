import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import * as Fetcher from '../GitHubFetcher.es6';
import Picker from '../ExamplePicker.es6';

const BTN_SELECTOR = '.btn-action';

describe('ExamplePicker', () => {
  const mount = () => {
    const confirmStub = sinon.stub();
    const cancelStub = sinon.stub();
    const wrapper = Enzyme.mount(<Picker onConfirm={confirmStub} onCancel={cancelStub} />);

    return [wrapper, confirmStub, cancelStub];
  };

  it('renders list of predefined extensions', () => {
    const [wrapper] = mount();
    expect(wrapper.find(BTN_SELECTOR)).toHaveLength(8);
  });

  it('blocks all installation buttons once clicked', () => {
    const [wrapper] = mount();
    const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
    fetchStub.returns({ then: handle => handle({ extension: true }) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    wrapper.find(BTN_SELECTOR).forEach(btn => {
      expect(btn.prop('disabled')).toBe(true);
    });
    fetchStub.restore();
  });

  it('confirms dialog with fetched extension', () => {
    expect.assertions(2);
    const [wrapper, confirmStub] = mount();
    const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
    fetchStub.returns({ then: handle => handle({ extension: true }) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    expect(confirmStub.calledOnce).toBeTruthy();
    expect(
      confirmStub.calledWith({
        extension: { extension: true },
        type: 'github-example',
        url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla'
      })
    ).toBeTruthy();
    fetchStub.restore();
  });

  it('cancels dialog with fetch error', () => {
    const [wrapper, _, cancelStub] = mount();
    const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
    fetchStub.returns({ then: (_, handle) => handle(new Error('error')) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    expect(cancelStub.calledOnce).toBeTruthy();
    expect(cancelStub.lastCall.args[0].message).toBe('error');
    fetchStub.restore();
  });
});
