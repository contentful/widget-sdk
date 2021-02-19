import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlatformKind } from '../utils/platformContent';
import { SpacePlanCards } from './SpacePlanCards';

const mockOnSelect = jest.fn();
const mockSpaceRatePlans = [
  { name: 'Community', price: 0 },
  { name: 'Medium', price: 489 },
  { name: 'Large', price: 889 },
];

const mockWebAppPlatform = { type: PlatformKind.SPACE };
const mockComposeLaunchPlatform = { type: PlatformKind.SPACE_COMPOSE_LAUNCH };

jest.mock('features/space-purchase/utils/canCreateSpace', () => ({
  canUserCreatePaidSpace: jest.fn(),
  canOrgCreateFreeSpace: jest.fn(),
}));

describe('SpacePlanCards', () => {
  let spacePlanCards;

  it('should render three cards for the space plans as disabled if the disabled prop is given', () => {
    build({ disabled: true });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards).toHaveLength(3);

    for (const spacePlanCard of spacePlanCards) {
      expect(spacePlanCard.getAttribute('class')).toContain('disabled');
    }
  });

  it('should call onSelect with the space plan when user clicks on the card', () => {
    build();
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    for (const i in spacePlanCards) {
      const spacePlanCard = spacePlanCards[i];
      userEvent.click(spacePlanCard);
      expect(mockOnSelect).toBeCalledWith(mockSpaceRatePlans[i]);
    }
  });

  // TODO: update userEvent dep so we can use userEvent.hover instead of fireEvent.mouseOver
  it('should disable the free space plan card and show a tooltip when Compose+Launch is selected and the org has no paid spaces', async () => {
    build({ selectedPlatform: mockComposeLaunchPlatform });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).not.toContain('disabled');

    fireEvent.mouseOver(spacePlanCards[0]);
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
    });
  });

  it('should enable the free space plan card and when Compose+Launch is selected and the org has at least one paid space', async () => {
    build({
      selectedPlatform: mockComposeLaunchPlatform,
      orgHasPaidSpaces: true,
    });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).not.toContain('disabled');
  });

  it('should disable Free Space Plan card and show tooltip when user cannot create any more free spaces', async () => {
    build({ canCreateFreeSpace: false });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).not.toContain('disabled');

    fireEvent.mouseOver(spacePlanCards[0]);
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
    });
  });

  it('should disable Paid Space Plan cards and show tooltip when user cannot create any paid spaces', async () => {
    build({ canCreatePaidSpace: false });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).toContain('disabled');

    fireEvent.mouseOver(spacePlanCards[1]);
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
    });
  });
});

function build(customProps) {
  const props = {
    spaceRatePlans: mockSpaceRatePlans,
    selectedPlatform: mockWebAppPlatform,
    selectedSpacePlanName: undefined,
    canCreateFreeSpace: true,
    canCreatePaidSpace: true,
    orgHasPaidSpaces: false,
    onSelect: mockOnSelect,
    ...customProps,
  };

  render(<SpacePlanCards {...props} />);
}
