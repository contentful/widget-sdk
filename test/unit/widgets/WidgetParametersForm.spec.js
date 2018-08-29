import React from 'react';
import Enzyme from 'enzyme';
import Form from 'widgets/WidgetParametersForm';

describe('WidgetParametersForm', () => {
  const mount = (definitions = [], values = {}, missing = {}) => {
    const updateStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <Form definitions={definitions} values={values} missing={missing} updateValue={updateStub} />
    );

    return [wrapper, updateStub];
  };

  it('updates Symbol parameters', () => {
    const definitions = [{ id: 'string', type: 'Symbol', name: 'String param' }];
    const [wrapper, updateStub] = mount(definitions);
    const input = wrapper.find('input').first();
    input.simulate('change', { target: { value: 'test' } });
    sinon.assert.calledOnce(updateStub.withArgs('string', 'test'));
  });

  it('updates Enum parameters', () => {
    const options = [{ one: 'Einz' }, { two: 'Zwei' }];
    const definitions = [{ id: 'enum', type: 'Enum', name: 'Enum param', options }];
    const [wrapper, updateStub] = mount(definitions);
    const select = wrapper.find('select').first();
    select.simulate('change', { target: { value: 'one' } });
    sinon.assert.calledOnce(updateStub.withArgs('enum', 'one'));
    select.simulate('change', { target: { value: '' } });
    sinon.assert.calledOnce(updateStub.withArgs('enum', undefined));
  });

  it('updates Number parameters', () => {
    const definitions = [{ id: 'num', type: 'Number', name: 'Num param' }];
    const [wrapper, updateStub] = mount(definitions);
    const input = wrapper.find('input').first();
    input.simulate('change', { target: { value: '123' } });
    sinon.assert.calledOnce(updateStub.withArgs('num', 123));
    input.simulate('change', { target: { value: 'wat?' } });
    sinon.assert.calledOnce(updateStub.withArgs('num', undefined));
  });

  it('updates Boolean parameters', () => {
    const definitions = [{ id: 'bool', type: 'Boolean', name: 'Bool param' }];
    const [wrapper, updateStub] = mount(definitions);
    const checkboxes = wrapper.find('input');
    checkboxes.at(0).simulate('change', { target: { checked: true } });
    sinon.assert.calledOnce(updateStub.withArgs('bool', true));
    checkboxes.at(1).simulate('change', { target: { checked: true } });
    sinon.assert.calledOnce(updateStub.withArgs('bool', false));
  });

  it('clearing Boolean parameter', () => {
    const definitions = [{ id: 'bool', type: 'Boolean', name: 'Bool param' }];
    const [wrapper, updateStub] = mount(definitions, { bool: true });
    const checkboxes = wrapper.find('input');
    checkboxes.at(0).simulate('change', { target: { checked: false } });
    sinon.assert.calledOnce(updateStub.withArgs('bool', undefined));
  });

  it('renders multiple inputs', () => {
    const [wrapper] = mount([
      { id: 'str', type: 'Symbol', name: 'String param' },
      { id: 'bool', type: 'Boolean', name: 'Bool param' }
    ]);
    expect(wrapper.find('input').length).toBe(3); // 1 for Symbol input + 2 for Boolean checkboxes
  });

  it('renders information about parameter being required', () => {
    const [wrapper] = mount([
      { id: 'str', type: 'Symbol', name: 'String param' },
      { id: 'bool', type: 'Boolean', name: 'Bool param', required: true }
    ]);
    const labels = wrapper.find('label');
    expect(
      labels
        .at(0)
        .text()
        .includes('(required)')
    ).toBe(false);
    expect(
      labels
        .at(1)
        .text()
        .includes('(required)')
    ).toBe(true);
  });

  it('renders information about required parameter being missing', () => {
    const definitions = [
      { id: 'str', type: 'Symbol', name: 'String param' },
      { id: 'bool', type: 'Boolean', name: 'Bool param', required: true }
    ];
    const [wrapper] = mount(definitions, { str: 'test' }, { bool: true });
    expect(wrapper.find('.cfnext-form__field-error').length).toBe(1);
    const fields = wrapper.find('.cfnext-form__field');
    expect(
      fields
        .at(1)
        .text()
        .includes('This value is required')
    ).toBe(true);
  });

  it('uses values for rendering', () => {
    const definitions = [
      { id: 'str', type: 'Symbol', name: 'String param' },
      { id: 'enum', type: 'Enum', name: 'Enum param', options: [{ one: '1', two: '2' }] },
      { id: 'num', type: 'Number', name: 'Number param' },
      { id: 'bool', type: 'Boolean', name: 'Bool param' }
    ];
    const values = { str: 'test', enum: 'two', num: 123, bool: true };
    const [wrapper] = mount(definitions, values);
    expect(wrapper.find('.cfnext-form__field').length).toBe(4);
    expect(wrapper.find('[name="str"]').props().value).toBe('test');
    expect(wrapper.find('[name="enum"]').props().value).toBe('two');
    expect(wrapper.find('[name="num"]').props().value).toBe('123');
    expect(wrapper.find('input[name="bool"]').props().checked).toBe(true);
  });

  it('renders description', () => {
    const definitions = [{ id: 'x', type: 'Symbol', name: 'X', description: 'Please gimme value' }];
    const [wrapper] = mount(definitions);
    expect(
      wrapper
        .find('p')
        .text()
        .includes('Please gimme value')
    ).toBe(true);
  });
});
