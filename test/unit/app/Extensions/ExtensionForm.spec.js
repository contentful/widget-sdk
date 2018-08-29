import React from 'react';
import Enzyme from 'enzyme';
import Form from 'app/Extensions/ExtensionForm';
import CodeMirror from 'react-codemirror';

const ERR_SELECTOR = '.cfnext-form__field-error';

describe('ExtensionForm', () => {
  const mount = (entity, selfHosted) => {
    const updateEntityStub = sinon.stub();
    const setSelfHostedStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <Form
        entity={entity}
        updateEntity={updateEntityStub}
        selfHosted={selfHosted}
        setSelfHosted={setSelfHostedStub}
      />
    );

    return [wrapper, updateEntityStub, setSelfHostedStub];
  };

  const basic = { name: 'test', fieldTypes: ['Text'], srcdoc: 'source' };

  it('renders the extension provided', () => {
    const [wrapper] = mount({ extension: basic }, false);
    const inputs = wrapper.find('input');

    expect(inputs.at(0).prop('value')).toBe('test'); // name
    expect(inputs.at(1).prop('checked')).toBe(false); // first checkbox - Symbol
    expect(inputs.at(2).prop('checked')).toBe(true); // second checkbox - Text

    // second radio - Contentful hosting
    expect(
      wrapper
        .find('input[type="radio"]')
        .at(1)
        .prop('checked')
    ).toBe(true);
    // first CodeMirror - value of `srcdoc` property
    expect(
      wrapper
        .find(CodeMirror)
        .at(0)
        .prop('value')
    ).toBe('source');
  });

  it('updates entity values', () => {
    const [wrapper, updateEntityStub] = mount({ extension: basic }, false);
    const inputs = wrapper.find('input');

    inputs.at(0).simulate('change', { target: { value: 'new-name' } });
    sinon.assert.calledWith(updateEntityStub, { extension: { ...basic, name: 'new-name' } });
    updateEntityStub.reset();

    inputs.at(1).simulate('change', { target: { checked: true } });
    sinon.assert.calledWith(updateEntityStub, {
      extension: { ...basic, fieldTypes: ['Text', 'Symbol'] }
    });
  });

  it('renders and validates self-hosted URL', () => {
    const extension = { name: 'test', fieldTypes: ['Text'], src: '' };
    const [wrapper] = mount({ extension }, true);
    const updateSrc = src =>
      wrapper.setProps({
        ...wrapper.props(),
        entity: { extension: { ...extension, src } }
      });
    const assertError = () =>
      expect(
        wrapper
          .find(ERR_SELECTOR)
          .text()
          .includes('Valid URLs')
      ).toBe(true);
    const assertOk = () => expect(wrapper.find(ERR_SELECTOR).length).toBe(0);

    // first radio - self hosted
    expect(
      wrapper
        .find('input[type="radio"]')
        .at(0)
        .prop('checked')
    ).toBe(true);

    assertError();
    updateSrc('https://x');
    assertOk();
    updateSrc('http://x');
    assertError();
    updateSrc('http://localhost');
    assertOk();
  });

  it('switches between hosted/self-hosted options', () => {
    const [wrapper, _, setSelfHostedStub] = mount({ extension: basic }, true);
    const radios = wrapper.find('input[type="radio"]');
    radios.at(1).simulate('change', { value: { checked: true } });
    sinon.assert.calledWith(setSelfHostedStub, false);
    radios.at(0).simulate('change', { value: { checked: true } });
    sinon.assert.calledWith(setSelfHostedStub, true);
  });

  it('renders installation and updates parameters form', () => {
    const installation = [{ id: 'test', type: 'Symbol', name: 'TEST' }];
    const extension = { ...basic, parameters: { installation } };
    const [wrapper, updateEntityStub] = mount(
      { extension, parameters: { test: 'hello world' } },
      true
    );
    const input = wrapper.find('input[name="test"]');
    expect(input.prop('value')).toBe('hello world');
    input.simulate('change', { target: { value: 'poop' } });
    sinon.assert.calledWith(updateEntityStub, { extension, parameters: { test: 'poop' } });
  });

  it('renders parameter definitions', () => {
    const param = { id: 'test', type: 'Symbol', name: 'TEST' };
    const definitions = { instance: [param], installation: [param] };
    const extension = { ...basic, parameters: definitions };
    const [wrapper] = mount({ extension }, true);
    expect(
      wrapper
        .find(CodeMirror)
        .at(0)
        .prop('value')
    ).toBe(JSON.stringify(definitions, null, 2));
  });
});
