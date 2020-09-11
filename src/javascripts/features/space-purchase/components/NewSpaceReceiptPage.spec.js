import React from 'react';
import { render, screen } from '@testing-library/react';

import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';

const spaceName = 'My Space';
const mockSelectedPlan = { name: 'Medium', price: 123 };

describe('NewSpaceReceiptPage', () => {
  it('should show the plan name and plan type', () => {
    build();

    expect(screen.getByTestId('new-space-receipt-success').textContent).toContain(spaceName);
    expect(screen.getByTestId('new-space-receipt-success').textContent).toContain(
      mockSelectedPlan.name
    );
  });
});

function build(customProps) {
  const props = {
    spaceName: spaceName,
    selectedPlan: mockSelectedPlan,
    ...customProps,
  };

  render(<NewSpaceReceiptPage {...props} />);
}
