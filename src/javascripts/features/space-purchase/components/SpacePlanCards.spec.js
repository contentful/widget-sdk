import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import { SpacePlanCards } from './SpacePlanCards';

const mockOnSelect = jest.fn();
const mockProductRatePlans = [
  { name: 'Community', price: 0 },
  { name: 'Medium', price: 489 },
  { name: 'Large', price: 889 },
];

describe('SpacePlanCards', () => {
  let spacePlanCards;

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

  // TODO: update userEvent dep so we can use .hover and unskip this
  it.skip('should disable Free Space Plan card and show tooltip when Compose+Launch is selected', () => {
    build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH });
    spacePlanCards = screen.getAllByTestId('space-plan-card');

    expect(spacePlanCards[0]).toHaveClass('disabled');
    expect(spacePlanCards[1]).not.toHaveClass('disabled');
    expect(spacePlanCards[2]).not.toHaveClass('disabled');
    expect(screen.queryByTestId('choose-space-later-button')).toBeNull();

    expect(screen.getByTestId('plan-card-tooltip')).toBeDefined();
  });

  describe('Choose Space Later', () => {
    it('should allow users to choose space later if they select Compose+Launch AND have already a paid space in the org', () => {
      build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH, orgHasPaidSpaces: true });

      expect(screen.getByTestId('choose-space-later-button')).toBeDefined();
      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
    });

    it('should disallow users to choose space plan later if they select Compose+Launch AND have no paid space in the org', () => {
      build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH });

      expect(screen.queryByTestId('choose-space-later-button')).toBeNull();
    });

    it('should unselect any space plan when clicking on "choose space later"', () => {
      build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH, orgHasPaidSpaces: true });

      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
      userEvent.click(screen.getByTestId('choose-space-later-button'));
      expect(mockOnSelect).toBeCalledWith('');
    });
  });

  it('should unselect any space plan when clicking on "choose space later"', () => {
    build({ selectedPlatform: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH, orgHasPaidSpaces: true });

    expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
    userEvent.click(screen.getByTestId('choose-space-later-button'));
    expect(mockOnSelect).toBeCalledWith('');
  });
});

function build(customProps) {
  const props = {
    spaceRatePlans: mockProductRatePlans,
    selectedPlatform: undefined,
    selectedSpacePlan: undefined,
    orgHasPaidSpaces: false,
    onSelect: mockOnSelect,
    ...customProps,
  };

  render(<SpacePlanCards {...props} />);
}
