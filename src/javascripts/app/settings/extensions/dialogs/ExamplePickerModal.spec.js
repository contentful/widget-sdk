import React from 'react';
import Enzyme from 'enzyme';
import * as Fetcher from './GitHubFetcher.es6';
import ExamplePickerModal from './ExamplePickerModal.es6';

const BTN_SELECTOR = '[data-test-id="install-extension"]';

describe('ExamplePickerModal', () => {
  const mount = () => {
    const confirmStub = jest.fn();
    const cancelStub = jest.fn();
    const wrapper = Enzyme.mount(
      <ExamplePickerModal isShown onConfirm={confirmStub} onCancel={cancelStub} />
    );

    return [wrapper, confirmStub, cancelStub];
  };

  it('renders list of some predefined extensions', () => {
    const [wrapper] = mount();
    const hasPredefined = wrapper.find(BTN_SELECTOR).length > 5;
    expect(hasPredefined).toBe(true);
  });

  it('confirms dialog with fetched extension', () => {
    expect.assertions(2);
    const [wrapper, confirmStub] = mount();
    const fetchStub = jest.spyOn(Fetcher, 'fetchExtension');
    fetchStub.mockReturnValue({ then: handle => handle({ extension: true }) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    expect(confirmStub).toHaveBeenCalledTimes(1);
    expect(confirmStub).toHaveBeenCalledWith({
      extension: { extension: true },
      url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla'
    });
    fetchStub.mockRestore();
  });

  it('cancels dialog with fetch error', () => {
    const [wrapper, _, cancelStub] = mount();
    const fetchStub = jest.spyOn(Fetcher, 'fetchExtension');
    fetchStub.mockReturnValue({ then: (_, handle) => handle(new Error('error')) });
    wrapper
      .find(BTN_SELECTOR)
      .first()
      .simulate('click');
    expect(cancelStub).toHaveBeenCalledTimes(1);
    expect(cancelStub.mock.calls[0][0].message).toBe('error');
    fetchStub.mockRestore();
  });
});
