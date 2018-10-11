import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import * as Fetcher from '../GitHubFetcher.es6';
import Installer from '../GitHubInstaller.es6';

const VALID_URL = 'https://github.com/jelz/sample/blob/master/extension.json';
const ERR_SELECTOR = '.cfnext-form__field-error';
const BTN_SELECTOR = '.btn-primary-action';

describe('GitHubInstaller', () => {
  const mount = () => {
    const confirmStub = sinon.stub();
    const wrapper = Enzyme.mount(<Installer onConfirm={confirmStub} onCancel={() => {}} />);

    return [wrapper, confirmStub];
  };

  it('initially does not render error but disallows installation', () => {
    expect.assertions(3);
    const [wrapper, confirmStub] = mount();
    expect(wrapper.find(ERR_SELECTOR)).toHaveLength(0);
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(true);
    installBtn.simulate('click');
    expect(confirmStub.called).toBeFalsy();
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

        const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
        fetchStub.returns({ then: handle => handle({ extension: true }) });
        installBtn.simulate('click');
        expect(fetchStub.calledWith(value)).toBeTruthy();
        expect(
          confirmStub.calledWith({
            extension: { extension: true },
            url: value
          })
        ).toBeTruthy();
        fetchStub.restore();
      }
    );
  });

  it('blocks button while fetching', () => {
    expect.assertions(2);
    const [wrapper] = mount();
    wrapper.find('input').simulate('change', { target: { value: VALID_URL } });
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(false);

    const fetchStub = sinon.stub(Fetcher, 'fetchExtension').resolves();
    installBtn.simulate('click');
    expect(wrapper.find(BTN_SELECTOR).prop('disabled')).toBe(true);
    fetchStub.restore();
  });

  it('renders fetch error and unblocks button', () => {
    expect.assertions(3);
    const [wrapper] = mount();
    wrapper.find('input').simulate('change', { target: { value: VALID_URL } });
    const installBtn = wrapper.find(BTN_SELECTOR);
    expect(installBtn.prop('disabled')).toBe(false);

    const fetchStub = sinon.stub(Fetcher, 'fetchExtension');
    fetchStub.returns({ then: (_, handle) => handle(new Error('x')) });
    installBtn.simulate('click');
    expect(wrapper.find(ERR_SELECTOR).text()).toBe('x');
    expect(wrapper.find(BTN_SELECTOR).prop('disabled')).toBe(false);
    fetchStub.restore();
  });
});
