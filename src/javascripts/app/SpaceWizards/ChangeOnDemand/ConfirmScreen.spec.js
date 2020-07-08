import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import ConfirmScreen from './ConfirmScreen';
import { freeSpace, microSpace, mediumSpace, largeSpace } from '../__tests__/fixtures/plans';

const mockSpace = Fake.Space();
const mockCurrentSpace = Fake.Space();
const mockCurrentSpaceSubscriptionPlan = {
  name: 'Medium',
  gatekeeperKey: mockCurrentSpace.sys.id,
  price: 489,
};
const mockCurrentSpaceSubscriptionPlanFree = {
  name: 'Free',
  gatekeeperKey: mockCurrentSpace.sys.id,
  price: 0,
};

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

  describe('without current subscription plan', () => {
    it('should not state any price, if the selected plan is free', () => {
      build({ currentSpaceSubscriptionPlan: null, selectedPlan: freeSpace });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} to a ${freeSpace.name} space type. The price of this space will remain the same.`
      );
    });

    it('should state the new price, if the selected plan is not free', () => {
      build({ currentSpaceSubscriptionPlan: null, selectedPlan: microSpace });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} to a ${
          microSpace.name
        } space type. The price of this space will now be $${
          microSpace.price
        } and change the total price of the spaces in your organization to $${
          150 + microSpace.price
        }/month.`
      );
    });
  });

  describe('with current subscription plan', () => {
    it('should state that the current space price will increase if the current plan is $0 but the selected plan is not', () => {
      build({
        currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlanFree,
        selectedPlan: microSpace,
      });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} from a ${
          mockCurrentSpaceSubscriptionPlanFree.name
        } to a ${microSpace.name} space type. The price of this space will increase to $${
          microSpace.price
        } and increase the total price of the spaces in your organization to $${
          150 + microSpace.price
        }/month.`
      );
    });

    it('should state that the total price will increase if the selected plan is more expensive', () => {
      build({
        currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlan,
        selectedPlan: largeSpace,
      });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} from a ${
          mockCurrentSpaceSubscriptionPlan.name
        } to a ${largeSpace.name} space type. The price of this space will change from $${
          mockCurrentSpaceSubscriptionPlan.price
        } to $${
          largeSpace.price
        } and will increase the total price of the spaces in your organization to $${
          150 + largeSpace.price - mockCurrentSpaceSubscriptionPlan.price
        }/month.`
      );
    });

    it('should state that the total price will decrease if the selected plan is less expensive', () => {
      build({
        currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlan,
        selectedPlan: microSpace,
      });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} from a ${
          mockCurrentSpaceSubscriptionPlan.name
        } to a ${microSpace.name} space type. The price of this space will change from $${
          mockCurrentSpaceSubscriptionPlan.price
        } to $${
          microSpace.price
        } and will reduce the total price of the spaces in your organization to $${
          150 + microSpace.price - mockCurrentSpaceSubscriptionPlan.price
        }/month.`
      );
    });

    it('should handle if downgrading to a free space', () => {
      build({
        currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlan,
        selectedPlan: freeSpace,
      });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} from a ${
          mockCurrentSpaceSubscriptionPlan.name
        } to a ${freeSpace.name} space type. The price of this space will change from $${
          mockCurrentSpaceSubscriptionPlan.price
        } to $${
          freeSpace.price
        } and will reduce the total price of the spaces in your organization to $${
          150 + freeSpace.price - mockCurrentSpaceSubscriptionPlan.price
        }/month.`
      );
    });

    it('should not state any price difference if the prices are the same', () => {
      build({
        currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlan,
        selectedPlan: mediumSpace,
      });

      expect(screen.getByTestId('contents').textContent).toEqual(
        `You’re about to change the space ${mockSpace.name} from a ${mockCurrentSpaceSubscriptionPlan.name} to a ${mediumSpace.name} space type. The price of this space will remain the same.`
      );
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedPlan: largeSpace,
      currentSpaceSubscriptionPlan: mockCurrentSpaceSubscriptionPlan,
      changing: false,
      onConfirm: () => {},
      space: mockSpace,
      currentSubscriptionPrice: 150,
    },
    custom
  );

  render(<ConfirmScreen {...props} />);
}
