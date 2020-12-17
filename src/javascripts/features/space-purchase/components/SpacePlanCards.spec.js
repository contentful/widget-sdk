import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import {
  canUserCreatePaidSpace,
  canOrgCreateFreeSpace,
} from 'features/space-purchase/utils/canCreateSpace';
import { SpacePlanCards } from './SpacePlanCards';
import { renderWithProvider } from '../__tests__/helpers';

const mockOnSelect = jest.fn();
const mockProductRatePlans = [
  { name: 'Community', price: 0 },
  { name: 'Medium', price: 489 },
  { name: 'Large', price: 889 },
];

jest.mock('features/space-purchase/utils/canCreateSpace', () => ({
  canUserCreatePaidSpace: jest.fn(),
  canOrgCreateFreeSpace: jest.fn(),
}));

describe('SpacePlanCards', () => {
  let spacePlanCards;
  beforeEach(() => {
    canUserCreatePaidSpace.mockReturnValue(true);
    canOrgCreateFreeSpace.mockReturnValue(true);
  });

  it('should render three cards for the space plans initially disabled', () => {
    build();
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards).toHaveLength(3);

    for (const spacePlanCard of spacePlanCards) {
      expect(spacePlanCard.getAttribute('class')).toContain('disabled');
    }
  });

  it('should call onSelect with the space plan name when user clicks on the card', () => {
    build();
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    for (const i in spacePlanCards) {
      const spacePlanCard = spacePlanCards[i];
      userEvent.click(spacePlanCard);
      expect(mockOnSelect).toBeCalledWith(mockProductRatePlans[i].name);
    }
  });

  // TODO: update userEvent dep so we can use userEvent.hover instead of fireEvent.mouseOver
  it('should disable the free space plan card and show a tooltip when Compose+Launch is selected and the org has no paid spaces', async () => {
    build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).not.toContain('disabled');
    expect(screen.queryByTestId('choose-space-later-button')).toBeNull();

    fireEvent.mouseOver(spacePlanCards[0]);
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
    });
  });

  it('should disable Free Space Plan card and show tooltip when user cannot create any more free spaces', async () => {
    canOrgCreateFreeSpace.mockReturnValue(false);
    build(
      { selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH },
      { subscriptionPlans: mockProductRatePlans }
    );
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
    canUserCreatePaidSpace.mockReturnValue(false);
    build({ selectedPlatform: PLATFORM_TYPES.SPACE });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0].getAttribute('class')).not.toContain('disabled');
    expect(spacePlanCards[1].getAttribute('class')).toContain('disabled');
    expect(spacePlanCards[2].getAttribute('class')).toContain('disabled');

    fireEvent.mouseOver(spacePlanCards[1]);
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
    });
  });

  describe('Choose Space Later', () => {
    it('should allow users to choose space later if they select Compose+Launch AND have already a paid space in the org', () => {
      build(
        { selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH },
        { subscriptionPlans: mockProductRatePlans }
      );

      expect(screen.getByTestId('choose-space-later-button')).toBeDefined();
      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
    });

    it('should disallow users to choose space plan later if they select Compose+Launch AND have no paid space in the org', () => {
      build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH });

      expect(screen.queryByTestId('choose-space-later-button')).toBeNull();
    });

    it('should unselect any space plan when clicking on "choose space later"', () => {
      build(
        { selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH },
        { subscriptionPlans: mockProductRatePlans }
      );

      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
      userEvent.click(screen.getByTestId('choose-space-later-button'));
      expect(mockOnSelect).toBeCalledWith('');
    });
  });
});

function build(customProps, customState) {
  const props = {
    selectedPlatform: undefined,
    selectedSpacePlan: undefined,
    onSelect: mockOnSelect,
    ...customProps,
  };

  renderWithProvider(
    SpacePlanCards,
    {
      spaceRatePlans: mockProductRatePlans,
      subscriptionPlans: [],
      ...customState,
    },
    props
  );
}
