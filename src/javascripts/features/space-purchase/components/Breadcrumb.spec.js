import React from 'react';
import { render, screen } from '@testing-library/react';

import { Breadcrumb } from './Breadcrumb';

const mockSteps = [
  { text: '1. Step', isActive: true },
  { text: '2. Step', isActive: false },
  { text: '3. Step', isActive: false },
];

describe('Breadcrumb', () => {
  it('should show a breadcrumb', () => {
    build();

    expect(screen.getByTestId('space-breadcrumb')).toBeVisible();
  });

  it('should show all the steps', () => {
    build();

    expect(screen.getByTestId('space-breadcrumb-list')).toBeVisible();
    expect(screen.getByTestId('space-breadcrumb-list').children).toHaveLength(mockSteps.length);
  });

  it('should show the active step properly', () => {
    build();

    expect(screen.getByTestId('space-breadcrumb-list')).toBeVisible();
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

  render(<Breadcrumb {...props} />);
}
