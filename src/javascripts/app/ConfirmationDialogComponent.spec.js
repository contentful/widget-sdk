import ConfirmationDialog from './ConfirmationDialogComponent.es6';
import Dialog from 'app/entity_editor/Components/Dialog';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';

describe('ConfirmationDialog', () => {
  const onConfirm = sinon.stub();
  const onCancel = sinon.stub();

  it('renders a dialog component', () => {
    const output = shallow(
      <ConfirmationDialog message="foobar" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog)).not.toBeUndefined();
  });

  it('renders the message', () => {
    const message = (
      <div>
        <h2>Hello world</h2>
        <p>Foo.</p>
      </div>
    );
    const output = shallow(
      <ConfirmationDialog message={message} onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Body).contains(message)).toBe(true);
  });

  it('does not render the dialog header if there is no title', () => {
    const output = shallow(
      <ConfirmationDialog message="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Header)).toHaveLength(0);
  });

  it('renders the dialog header if there is a title', () => {
    const title = 'Hello world';
    const output = shallow(
      <ConfirmationDialog title={title} message="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(output.find(Dialog.Header).contains(title)).toBe(true);
  });

  describe('events', () => {
    const output = shallow(
      <ConfirmationDialog message="foo" onConfirm={onConfirm} onCancel={onCancel} />
    );

    it('triggers onConfirm', () => {
      const confirmBtn = output.find('.confirmation-dialog__confirm');
      confirmBtn.simulate('click');
      expect(onConfirm.called).toBe(true);
    });

    it('triggers onCancel', () => {
      const cancelBtn = output.find('.confirmation-dialog__cancel');
      cancelBtn.simulate('click');

      expect(onCancel.called).toBe(true);
    });
  });
});
