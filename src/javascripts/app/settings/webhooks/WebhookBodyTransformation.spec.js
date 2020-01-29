import React from 'react';

import { render, fireEvent } from '@testing-library/react';
import WebhookBodyTransformation from './WebhookBodyTransformation';

describe('WebhookBodyTransformation', () => {
  const renderComponent = body => {
    const onChangeStub = jest.fn();
    const wrapper = render(<WebhookBodyTransformation body={body} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  const findRadioButtons = element =>
    element.querySelectorAll('.webhook-editor__settings-option input[type="radio"]');
  const findEditor = element => element.querySelector('.react-codemirror2 .CodeMirror-code');

  const assertRadioButtons = (wrapper, [e1, e2]) => {
    const radioButtons = findRadioButtons(wrapper);
    expect(radioButtons[0].checked).toBe(e1);
    expect(radioButtons[1].checked).toBe(e2);
  };

  it('does not render editor if no body provided', () => {
    const [{ container }] = renderComponent(undefined);
    assertRadioButtons(container, [true, false]);
    expect(findEditor(container)).not.toBeInTheDocument();
  });

  it('renders editor if empty body provided', () => {
    const [{ container }] = renderComponent('');
    assertRadioButtons(container, [false, true]);
    const editor = findEditor(container);
    expect(editor.textContent).toBe('');
  });

  it('shows editor and sets empty value when selecting custom body', () => {
    const [{ container }, onChangeStub] = renderComponent(undefined);
    const radioButtons = findRadioButtons(container);
    fireEvent.click(radioButtons[1]);
    expect(onChangeStub).toHaveBeenCalledWith('');
  });

  it('hides editor and removes value when selecting no custom body', () => {
    const [{ container }, onChangeStub] = renderComponent('test');
    const radioButtons = findRadioButtons(container);
    fireEvent.click(radioButtons[0]);
    expect(onChangeStub).toHaveBeenCalledWith(undefined);
  });
});
