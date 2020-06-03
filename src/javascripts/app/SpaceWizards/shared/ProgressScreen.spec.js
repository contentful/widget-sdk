import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressScreen from './ProgressScreen';

describe('ProgressScreen', () => {
  it('should show a spinner and disable the button if done is not true', () => {
    build();

    expect(screen.getByTestId('create-template-progress')).toBeVisible();
    expect(screen.getByTestId('get-started-button')).toHaveAttribute('disabled');
  });

  it('should show a checkmark and enable the button if done is true', () => {
    build({ done: true });

    expect(screen.getByTestId('create-template-done')).toBeVisible();
    expect(screen.getByTestId('get-started-button')).not.toHaveAttribute('disabled');
  });

  it('should call onConfirm when clicking on the Get Started button', () => {
    const onConfirm = jest.fn();

    build({ done: true, onConfirm });

    userEvent.click(screen.getByTestId('get-started-button'));

    expect(onConfirm).toBeCalled();
  });
});

function build(custom = {}) {
  const props = Object.assign(
    {
      done: false,
      onConfirm: () => {},
    },
    custom
  );

  render(<ProgressScreen {...props} />);
}
