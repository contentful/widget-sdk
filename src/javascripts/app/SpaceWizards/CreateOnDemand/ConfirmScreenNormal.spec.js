import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmScreenNormal from './ConfirmScreenNormal';

describe('ConfirmScreenNormal', () => {
  it('should show the free space copy when the selected plan price is 0', () => {
    build();

    expect(screen.getByTestId('body-copy')).toHaveTextContent(
      'You are about to create a free space for'
    );
  });

  it('should show purchase copy when the selected plan price is greater than 0', () => {
    build({
      selectedPlan: {
        name: 'space plan',
        price: 1,
      },
    });

    expect(screen.getByTestId('body-copy')).toHaveTextContent('You are about to purchase a');
  });

  it('should show the template copy is given a selected template', () => {
    build({
      selectedTemplate: {
        name: 'a template',
      },
    });

    expect(screen.getByTestId('body-copy')).toHaveTextContent(
      'and we will fill it with example content'
    );
  });

  it('should call onConfirm when clicking the button', () => {
    const onConfirm = jest.fn();

    build({ onConfirm });

    userEvent.click(screen.getByTestId('confirm-button'));

    expect(onConfirm).toBeCalled();
  });

  it('should disable and set the button to loading when creating is true', () => {
    build({ creating: true });

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
    expect(within(screen.getByTestId('confirm-button')).getByTestId('cf-ui-spinner')).toBeVisible();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedPlan: {
        name: 'space plan',
        price: 0,
      },
      creating: false,
      onConfirm: () => {},
      organization: {
        name: 'Organization name',
      },
      currentSubscriptionPrice: 0,
      spaceName: 'Space name',
      selectedTemplate: null,
    },
    custom
  );

  render(<ConfirmScreenNormal {...props} />);
}
