import ConfirmationDialog from './ConfirmationDialogComponent.es6';
import Dialog from 'app/entity_editor/Components/Dialog';
import React from 'react';
import { shallow } from 'enzyme';

describe('ConfirmationDialog', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  it('renders a dialog component', () => {
    const output = shallow(
      <ConfirmationDialog body="foobar" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog)).not.toBeUndefined();
  });

  it('renders the body', () => {
    const body = (
      <div>
        <h2>Hello world</h2>
        <p>Foo.</p>
      </div>
    );
    const output = shallow(
      <ConfirmationDialog body={body} onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Body).contains(body)).toBe(true);
  });

  it('does not render the dialog header if there is no title', () => {
    const output = shallow(
      <ConfirmationDialog body="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Header)).toHaveLength(0);
  });

  it('renders the dialog header if there is a title', () => {
    const title = 'Hello world';
    const output = shallow(
      <ConfirmationDialog title={title} body="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Header).contains(title)).toBe(true);
  });

  describe('events', () => {
    const output = shallow(
      <ConfirmationDialog body="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );

    it('triggers onConfirm', () => {
      const confirmBtn = output.find('.confirmation-dialog__confirm');
      confirmBtn.simulate('click');
      expect(onConfirm).toHaveBeenCalled();
    });

    it('triggers onCancel', () => {
      const cancelBtn = output.find('.confirmation-dialog__cancel');
      cancelBtn.simulate('click');
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
