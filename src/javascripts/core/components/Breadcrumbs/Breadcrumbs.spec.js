import React from 'react';
import { render, screen } from '@testing-library/react';

import { Breadcrumbs } from './Breadcrumbs';

const mockSteps = [
  { text: '1. Step', isActive: true },
  { text: '2. Step', isActive: false },
  { text: '3. Step', isActive: false },
];

describe('Breadcrumbs', () => {
  it('should show a breadcrumbs', () => {
    build();

    expect(screen.getByTestId('wizard-breadcrumbs')).toBeVisible();
  });

  it('should show all the steps', () => {
    build();

    expect(screen.getByTestId('wizard-breadcrumbs-list')).toBeVisible();
    expect(screen.getByTestId('wizard-breadcrumbs-list').children).toHaveLength(mockSteps.length);
  });

  it('should show the active step properly', () => {
    build();

    expect(screen.getByTestId('wizard-breadcrumbs-list')).toBeVisible();
    expect(screen.getByText(mockSteps[0].text)).toHaveAttribute(
      'class',
      expect.stringMatching('-isActive')
    );
  });
});

function build(customProps) {
  const props = {
    items: mockSteps,
    ...customProps,
  };

  render(<Breadcrumbs {...props} />);
}
