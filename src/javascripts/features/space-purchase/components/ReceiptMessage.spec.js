import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { go } from 'states/Navigator';
import { trackEvent } from '../utils/analyticsTracking';
import { ReceiptMessage } from './ReceiptMessage';

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('../hooks/useSessionMetadata', () => ({
  useSessionMetadata: jest.fn().mockReturnValue('sessionData'),
}));

describe('ReceiptMessage', () => {
  it('should track when the rename space button is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('rename-space-button'));

    expect(go).toBeCalledWith({
      params: { spaceId: '123' },
      path: ['spaces', 'detail', 'settings', 'space'],
    });
    expect(trackEvent).toBeCalledWith('rename_space_clicked', 'sessionData');
  });
});

function build(customProps) {
  const props = {
    planName: 'Medium',
    spaceName: 'new space',
    spaceId: '123',
    pending: false,
    hasErrors: false,
    isSpaceUpgrade: false,
    selectedCompose: true,
    ...customProps,
  };

  render(<ReceiptMessage {...props} />);
}
