import React from 'react';
import { screen, render, fireEvent, wait } from '@testing-library/react';
import { openDeleteSpaceDialog, DeleteSpaceModal } from './DeleteSpace';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { isEnterprisePlan, isFreeSpacePlan } from 'account/pricing/PricingDataProvider';
import { openModal as openCommitedSpaceWarningModal } from 'components/shared/space-wizard/CommittedSpaceWarningModal';
import * as TokenStore from 'services/TokenStore';
import { Notification } from '@contentful/forma-36-react-components';
import APIClient from 'data/APIClient';

jest.mock('services/TokenStore');

jest.mock('data/APIClient', () => {
  const client = {
    deleteSpace: jest.fn().mockResolvedValue(),
  };

  return function () {
    return client;
  };
});

jest.mock('components/shared/space-wizard/CommittedSpaceWarningModal', () => ({
  openModal: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
  isFreeSpacePlan: jest.fn(),
}));

jest.useFakeTimers();

const cleanupNotifications = () => {
  if (!global.setTimeout.mock) {
    throw new Error('Call `jest.useFakeTimers()` in the spec file');
  }

  Notification.closeAll();
  jest.runOnlyPendingTimers();
};

describe('DeleteSpace service', () => {
  const space = { name: 'DeepSpace', sys: { id: '_id' } };
  const plan = { planType: 'free_space', customerType: 'Self-service' };

  describe('openDeleteSpaceDialog', () => {
    const open = (otherProps) => {
      const props = Object.assign(
        {
          space,
          plan,
          onSuccess: () => {},
        },
        otherProps
      );

      return openDeleteSpaceDialog(props);
    };

    beforeEach(() => {
      ModalLauncher.open.mockResolvedValue(true);
      TokenStore.refresh.mockReturnValue({});
    });

    afterEach(() => {
      ModalLauncher.open.mockClear();
      TokenStore.refresh.mockClear();
    });

    it('should call onSuccess if ModalLauncher.open resolves true', async () => {
      const onSuccessMock = jest.fn();

      await open({ onSuccess: onSuccessMock });
      expect(onSuccessMock).toBeCalled();
    });

    it('should do nothing nothing if ModalLauncher.open does not resolve true', async () => {
      ModalLauncher.open.mockResolvedValueOnce();

      const onSuccessMock = jest.fn();
      await open({ onSuccess: onSuccessMock });
      expect(onSuccessMock).not.toBeCalled();
    });

    it('should call openCommitedSpaceWarningModal if the plan is enterprise and not free', async () => {
      isEnterprisePlan.mockReturnValue(true);
      isFreeSpacePlan.mockReturnValue(true);

      await open();

      expect(openCommitedSpaceWarningModal).not.toBeCalled();

      isFreeSpacePlan.mockReturnValue(false);

      await open();

      expect(openCommitedSpaceWarningModal).toBeCalled();
    });
  });

  describe('DeleteSpaceModal Component', () => {
    afterEach(cleanupNotifications);

    const build = (otherProps) => {
      const props = Object.assign(
        {
          isShown: true,
          onClose: () => {},
          space,
        },
        otherProps
      );

      return render(<DeleteSpaceModal {...props} />);
    };

    it('should enable confirmation button after entering correct space name', async () => {
      build();

      const { getByTestId } = screen;

      const spaceNameField = getByTestId('space-name-confirmation-field');
      const deleteSpaceButton = getByTestId('delete-space-confirm-button');
      expect(spaceNameField.value).toBe('');
      expect(deleteSpaceButton.disabled).toBe(true);
      await fireEvent.change(spaceNameField, { target: { value: space.name } });
      expect(spaceNameField.value).toBe(space.name);
      expect(deleteSpaceButton.disabled).toBe(false);
    });

    it('should call onClose with false after delete cancellation', async () => {
      const onCloseMock = jest.fn();
      build({ onClose: onCloseMock });

      const { getByTestId } = screen;

      const cancelDeleteButton = getByTestId('delete-space-cancel-button');
      await fireEvent.click(cancelDeleteButton);
      expect(onCloseMock).toBeCalledWith(false);
    });

    it('should call onClose with false after closing the modal', async () => {
      const onCloseMock = jest.fn();
      build({ onClose: onCloseMock });

      const { getByTestId } = screen;

      const closeDialogButton = getByTestId('cf-ui-icon-button');
      await fireEvent.click(closeDialogButton);
      expect(onCloseMock).toBeCalledWith(false);
    });

    it('should delete the space and calls onClose with true upon confirming', async () => {
      const onCloseMock = jest.fn();
      build({ onClose: onCloseMock });

      const { getByTestId, findByTestId } = screen;

      const spaceNameField = getByTestId('space-name-confirmation-field');
      const deleteSpaceButton = getByTestId('delete-space-confirm-button');
      await fireEvent.change(spaceNameField, { target: { value: space.name } });
      await fireEvent.click(deleteSpaceButton);

      await wait();

      const client = new APIClient();

      expect(client.deleteSpace).toBeCalled();
      expect(TokenStore.refresh).toBeCalled();
      expect(onCloseMock).toHaveBeenCalledWith(true);

      expect(await findByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'success');
    });

    it('should trigger an error if deleting the space fails', async () => {
      const client = new APIClient();
      client.deleteSpace.mockRejectedValueOnce();

      const onCloseMock = jest.fn();
      build({ onClose: onCloseMock });

      const { getByTestId } = screen;

      const spaceNameField = getByTestId('space-name-confirmation-field');
      const deleteSpaceButton = getByTestId('delete-space-confirm-button');
      await fireEvent.change(spaceNameField, { target: { value: space.name } });
      await fireEvent.click(deleteSpaceButton);

      await wait();

      expect(client.deleteSpace).toBeCalled();
      expect(TokenStore.refresh).not.toBeCalled();
      expect(onCloseMock).not.toBeCalled();

      expect(getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
    });
  });
});
