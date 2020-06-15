import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import ConfirmScreen from './ConfirmScreen';
import { microSpace, mediumSpaceCurrent, largeSpace, freeSpace } from '../__tests__/fixtures/plans';

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

    // 150 (current sub price)
    // - medium space price (current plan price)
    // + large space price (selected plan price)
    expect(screen.getByTestId('contents')).toHaveTextContent(
      `the total price of the spaces in your organization to $${
        150 - mediumSpaceCurrent.price + largeSpace.price
      } /month`
    );
  });

  describe('free to paid space', () => {
    it('should show the free -> paid space copy', () => {
      build({ currentPlan: freeSpace });

      expect(screen.getByTestId('contents')).toHaveTextContent(
        `The price of this space will now be $${largeSpace.price}`
      );
    });
  });

  describe('paid spaces, lower to higher price', () => {
    it('should show the paid lower -> higher space copy', () => {
      build();

      expect(screen.getByTestId('contents')).toHaveTextContent(
        `The price of this space will change from $${mediumSpaceCurrent.price} to $${largeSpace.price} and will increase`
      );
    });
  });

  describe('paid spaces, higher to lower price', () => {
    it('should show the paid higher -> lower space copy', () => {
      build({ selectedPlan: microSpace });

      expect(screen.getByTestId('contents')).toHaveTextContent(
        `The price of this space will change from $${mediumSpaceCurrent.price} to $${microSpace.price} and will reduce`
      );
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedPlan: largeSpace,
      currentPlan: mediumSpaceCurrent,
      changing: false,
      onConfirm: () => {},
      space: mockSpace,
      currentSubscriptionPrice: 150,
    },
    custom
  );

  render(<ConfirmScreen {...props} />);
}
