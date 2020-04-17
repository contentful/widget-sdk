import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { openDeleteSpaceDialog, DeleteSpaceModal } from './DeleteSpace';
import { ModalLauncher } from 'core/components/ModalLauncher';
import * as TokenStore from 'services/TokenStore';
import { Notification } from '@contentful/forma-36-react-components';

jest.mock('services/TokenStore');

describe('DeleteSpace service', () => {
  describe('openDeleteSpaceDialog', () => {
    beforeEach(() => {
      ModalLauncher.open.mockResolvedValue(true);
      TokenStore.refresh.mockReturnValue({});
    });

    afterEach(() => {
      ModalLauncher.open.mockClear();
      TokenStore.refresh.mockClear();
    });

    it('deletes space and calls onSuccess', async () => {
      const spaceMock = { name: 'DeepSpace', sys: { id: '_id' } };
      const planMock = { planType: 'free_space', customerType: 'Self-service' };
      const onSuccessMock = jest.fn();
      await openDeleteSpaceDialog({ space: spaceMock, plan: planMock, onSuccess: onSuccessMock });
      expect(onSuccessMock).toBeCalled();
    });
    it('deletes space and refreshes token', async () => {
      const spaceMock = { name: 'DeepSpace', sys: { id: '_id' } };
      const planMock = { planType: 'free_space', customerType: 'Self-service' };
      await openDeleteSpaceDialog({ space: spaceMock, plan: planMock, onSuccess: () => {} });
      expect(TokenStore.refresh).toBeCalled();
    });
    it('notifies about success', async () => {
      Notification.success = jest.fn();
      Notification.success = jest.fn();
      const spaceMock = { name: 'DeepSpace', sys: { id: '_id' } };
      const planMock = { planType: 'free_space', customerType: 'Self-service' };
      await openDeleteSpaceDialog({ space: spaceMock, plan: planMock, onSuccess: () => {} });
      expect(Notification.success).toBeCalled();
    });
  });

  describe('DeleteSpaceModal Component', () => {
    it('enables delete confirmation after entering correct space name', async () => {
      const spaceName = 'DeepSpace';
      const { getByTestId } = render(
        <DeleteSpaceModal isShown={true} onClose={() => {}} spaceName={spaceName} />
      );
      const spaceNameField = getByTestId('space-name-confirmation-field');
      const deleteSpaceButton = getByTestId('delete-space-confirm-button');
      expect(spaceNameField.value).toBe('');
      expect(deleteSpaceButton.disabled).toBe(true);
      await fireEvent.change(spaceNameField, { target: { value: spaceName } });
      expect(spaceNameField.value).toBe(spaceName);
      expect(deleteSpaceButton.disabled).toBe(false);
    });
    it('calls onClose with true after delete confirmation', async () => {
      const spaceName = 'DeepSpace';
      const onCloseMock = jest.fn();
      const { getByTestId } = render(
        <DeleteSpaceModal isShown={true} onClose={onCloseMock} spaceName={spaceName} />
      );
      const spaceNameField = getByTestId('space-name-confirmation-field');
      const deleteSpaceButton = getByTestId('delete-space-confirm-button');
      await fireEvent.change(spaceNameField, { target: { value: spaceName } });
      await fireEvent.click(deleteSpaceButton);
      expect(onCloseMock).toBeCalledWith(true);
    });
    it('calls onClose with false after delete cancellation', async () => {
      const spaceName = 'DeepSpace';
      const onCloseMock = jest.fn();
      const { getByTestId } = render(
        <DeleteSpaceModal isShown={true} onClose={onCloseMock} spaceName={spaceName} />
      );
      const cancelDeleteButton = getByTestId('delete-space-cancel-button');
      await fireEvent.click(cancelDeleteButton);
      expect(onCloseMock).toBeCalledWith(false);
    });
    it('calls onClose with false after closing the modal', async () => {
      const spaceName = 'DeepSpace';
      const onCloseMock = jest.fn();
      const { getByTestId } = render(
        <DeleteSpaceModal isShown={true} onClose={onCloseMock} spaceName={spaceName} />
      );
      const closeDialogButton = getByTestId('cf-ui-icon-button');
      await fireEvent.click(closeDialogButton);
      expect(onCloseMock).toBeCalledWith(false);
    });
  });
});
