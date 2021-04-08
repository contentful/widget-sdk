import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalLauncher } from '@contentful/forma-36-react-components';

import { DangerZoneSection } from './DangerZoneSection';

function build(customProps) {
  const props = {
    singleOwnerOrganizations: [],
    ...customProps,
  };
  render(<DangerZoneSection {...props} />);
}

describe('DangerZoneSection', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open');
  });

  it('should open Modal if "Delete my account" button is clicked', async () => {
    build();

    fireEvent.click(screen.queryByTestId('delete-cta'));

    await waitFor(() => expect(screen.queryByTestId('delete-user-modal')).not.toBeNull());
  });
});
