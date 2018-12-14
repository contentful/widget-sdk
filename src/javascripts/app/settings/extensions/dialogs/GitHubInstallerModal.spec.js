import React from 'react';
import Enzyme from 'enzyme';
import * as Fetcher from './GitHubFetcher.es6';
import GitHubInstallerModal from './GitHubInstallerModal.es6';

const VALID_URL = 'https://github.com/jelz/sample/blob/master/extension.json';
const ERR_SELECTOR = '[data-test-id="cf-ui-validation-message"]';
const BTN_SELECTOR = '[data-test-id="cf-ui-modal-confirm-confirm-button"]';

describe('GitHubInstallerModal', () => {
  const mount = () => {
    const confirmStub = jest.fn();
    const wrapper = Enzyme.mount(
      <GitHubInstallerModal isShown onConfirm={confirmStub} onCancel={() => {}} />
    );

    return [wrapper, confirmStub];
  };

  it('initially does not render error but disallows installation', () => {
    expect.assertions(3);
    const [wrapper, confirmStub] = mount();
    expect(wrapper.find(ERR_SELECTOR)).toHaveLength(0);
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(true);
    installBtn.simulate('click');
    expect(confirmStub).not.toHaveBeenCalled();
  });

  it('renders error message and disallows installation when invalid URL is provided', () => {
    expect.assertions(1);
    const [wrapper] = mount();
    wrapper.find('input').simulate('change', { target: { value: 'test' } });
    expect(wrapper.find(ERR_SELECTOR).text()).toBe('Please provide a valid GitHub URL');
  });

  it('accepts valid Github URLs', () => {
    expect.assertions(8);
    [VALID_URL, 'https://raw.githubusercontent.com/jelz/sample/master/extension.json'].forEach(
      value => {
        const [wrapper, confirmStub] = mount();
        wrapper.find('input').simulate('change', { target: { value } });
        expect(wrapper.find(ERR_SELECTOR)).toHaveLength(0);
        const installBtn = wrapper.find(BTN_SELECTOR);
        expect(installBtn.prop('disabled')).toBe(false);

        const fetchStub = jest.spyOn(Fetcher, 'fetchExtension');
        fetchStub.mockReturnValue({ then: handle => handle({ extension: true }) });
        installBtn.simulate('click');
        expect(fetchStub).toHaveBeenCalledWith(value);
        expect(confirmStub).toHaveBeenCalledWith({
          extension: { extension: true },
          url: value
        });
        fetchStub.mockRestore();
      }
    );
  });

  it('blocks button while fetching', () => {
    expect.assertions(2);
    const [wrapper] = mount();
    wrapper.find('input').simulate('change', { target: { value: VALID_URL } });
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(false);

    const fetchStub = jest.spyOn(Fetcher, 'fetchExtension');
    fetchStub.mockResolvedValue();
    installBtn.simulate('click');
    expect(wrapper.find(BTN_SELECTOR).prop('disabled')).toBe(true);
    fetchStub.mockRestore();
  });

  it('renders fetch error and unblocks button', () => {
    expect.assertions(3);
    const [wrapper] = mount();
    wrapper.find('input').simulate('change', { target: { value: VALID_URL } });
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(false);

    const fetchStub = jest.spyOn(Fetcher, 'fetchExtension');
    fetchStub.mockReturnValue({ then: (_, handle) => handle(new Error('x')) });
    installBtn.simulate('click');
    expect(wrapper.find(ERR_SELECTOR).text()).toBe('x');
    expect(wrapper.find(BTN_SELECTOR).prop('disabled')).toBe(false);
    fetchStub.mockRestore();
  });
});
