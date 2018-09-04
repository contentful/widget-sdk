import React from 'react';
import Enzyme from 'enzyme';
import WebhookBodyTransformation from 'app/Webhooks/WebhookBodyTransformation.es6';
import CodeMirror from 'react-codemirror';

describe('WebhookBodyTransformation', function() {
  const mount = body => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(<WebhookBodyTransformation body={body} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  const findCheckboxes = wrapper => wrapper.find('.webhook-editor__settings-option input');
  const findEditor = wrapper => wrapper.find(CodeMirror);

  const assertCheckboxes = (wrapper, [e1, e2]) => {
    const checkboxes = findCheckboxes(wrapper);
    expect(checkboxes.at(0).prop('checked')).toBe(e1);
    expect(checkboxes.at(1).prop('checked')).toBe(e2);
  };

  it('does not render editor if no body provided', function() {
    const [wrapper] = mount(undefined);
    assertCheckboxes(wrapper, [true, false]);
    expect(findEditor(wrapper).length).toBe(0);
  });

  it('renders editor if empty body provided', function() {
    const [wrapper] = mount('');
    assertCheckboxes(wrapper, [false, true]);
    const editor = findEditor(wrapper);
    expect(editor.length).toBe(1);
    expect(editor.first().prop('value')).toBe('');
  });

  it('renders editor if non-empty body provided', function() {
    const [wrapper] = mount('test');
    assertCheckboxes(wrapper, [false, true]);
    const editor = findEditor(wrapper);
    expect(editor.length).toBe(1);
    expect(editor.first().prop('value')).toBe('test');
  });

  it('shows editor and sets empty value when selecting custom body', function() {
    const [wrapper, onChangeStub] = mount(undefined);
    const checkboxes = findCheckboxes(wrapper);
    checkboxes.at(1).simulate('change', { target: { checked: true } });

    sinon.assert.calledWith(onChangeStub, '');
    wrapper.setProps({ body: '' });
    assertCheckboxes(wrapper, [false, true]);
  });

  it('hides editor and removes value when selecting no custom body', function() {
    const [wrapper, onChangeStub] = mount('test');
    const checkboxes = findCheckboxes(wrapper);
    checkboxes.at(0).simulate('change', { target: { checked: true } });

    sinon.assert.calledWith(onChangeStub, undefined);
    wrapper.setProps({ body: undefined });
    assertCheckboxes(wrapper, [true, false]);
  });

  it('stores value if selecting no custom body and then custom body', function() {
    const INITIAL_VALUE = 'test';
    const CHANGED_VALUE = 'my changed body';

    const [wrapper, onChangeStub] = mount(INITIAL_VALUE);
    const checkboxes = findCheckboxes(wrapper);

    const selectNoCustomBody = () => {
      checkboxes.at(0).simulate('change', { target: { checked: true } });
      sinon.assert.calledWith(onChangeStub, undefined);
      wrapper.setProps({ body: undefined });
    };

    const selectCustomBodyAndExpect = expectedValue => {
      checkboxes.at(1).simulate('change', { target: { checked: true } });
      sinon.assert.calledWith(onChangeStub, expectedValue);
      wrapper.setProps({ body: expectedValue });
    };

    const changeBody = body => {
      findEditor(wrapper).prop('onChange')(body);
      sinon.assert.calledWith(onChangeStub, body);
      wrapper.setProps({ body });
    };

    selectNoCustomBody();
    selectCustomBodyAndExpect(INITIAL_VALUE);
    changeBody(CHANGED_VALUE);
    selectNoCustomBody();
    selectCustomBodyAndExpect(CHANGED_VALUE);
  });
});
