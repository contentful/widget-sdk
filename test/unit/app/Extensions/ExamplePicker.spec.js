import React from 'react';
import Enzyme from 'enzyme';
import * as Fetcher from 'app/Extensions/GitHubFetcher';
import Picker from 'app/Extensions/ExamplePicker';

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
    expect(wrapper.find(BTN_SELECTOR).length).toBe(7);
  });

  it('blocks all installation buttons once clicked', () => {
    const [wrapper] = mount();
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    wrapper.find(BTN_SELECTOR).forEach(btn => {
      expect(btn.prop('disabled')).toBe(true);
    });
  });

  it('confirms dialog with fetched extension', () => {
    const [wrapper, confirmStub] = mount();
    const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
    fetchStub.returns({ then: handle => handle({ extension: true }) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    sinon.assert.calledOnce(confirmStub);
    sinon.assert.calledWith(confirmStub, {
      extension: { extension: true },
      type: 'github-example',
      url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla'
    });
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
    sinon.assert.calledOnce(cancelStub);
    expect(cancelStub.lastCall.args[0].message).toBe('error');
    fetchStub.restore();
  });
});
