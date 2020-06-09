import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import ConfirmScreen from './ConfirmScreen';

const mockCurrentPlan = Fake.Plan({ price: 100 });
const mockCurrentPlanFree = Fake.Plan({ price: 0 });
const mockSelectedPlanHigherPrice = Fake.Plan({
  price: 200,
});
const mockSelectedPlanLowerPrice = Fake.Plan({ price: 50 });
const mockSpace = Fake.Space();

describe('ConfirmScreen', () => {
  it('should call onConfirm when the confirm button is clicked', () => {
    const onConfirm = jest.fn();
    build({ onConfirm });

    userEvent.click(screen.getByTestId('confirm-button'));

    expect(onConfirm).toBeCalled();
  });

  it('should disable the button if changing is true', () => {
    build({ changing: true });

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
  });

  it('should show the total price for the subscription + space change', () => {
    build();

    // 150 (current sub price) - 100 (current plan price) + 200 (selected plan price)
    expect(screen.getByTestId('contents')).toHaveTextContent(
      'the total price of the spaces in your organization to $250 /month'
    );
  });

  describe('free to paid space', () => {
    it('should show the free -> paid space copy', () => {
      build({ currentPlan: mockCurrentPlanFree });

      expect(screen.getByTestId('contents')).toHaveTextContent(
        'The price of this space will now be $200'
      );
    });
  });

  describe('paid spaces, lower to higher price', () => {
    it('should show the paid lower -> higher space copy', () => {
      build();

      expect(screen.getByTestId('contents')).toHaveTextContent(
        'The price of this space will change from $100 to $200 and will increase'
      );
    });
  });

  describe('paid spaces, higher to lower price', () => {
    it('should show the paid higher -> lower space copy', () => {
      build({ selectedPlan: mockSelectedPlanLowerPrice });

      expect(screen.getByTestId('contents')).toHaveTextContent(
        'The price of this space will change from $100 to $50 and will reduce'
      );
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedPlan: mockSelectedPlanHigherPrice,
      currentPlan: mockCurrentPlan,
      changing: false,
      onConfirm: () => {},
      space: mockSpace,
      currentSubscriptionPrice: 150,
    },
    custom
  );

  render(<ConfirmScreen {...props} />);
}
