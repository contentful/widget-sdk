import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  AliasChangedChoiceModal,
  AliasChangedInfoModal,
  AliasDeletedInfoModal,
  MasterAliasMovedModal,
} from './Notifications';
import * as Navigator from 'states/Navigator';

const defaultChangedOptions = {
  newTarget: 'newTarget',
  oldTarget: 'oldTarget',
  aliasId: 'aliasId',
  isShown: true,
  onClose: () => undefined,
};

const defaultCreatedOrDeletedOptions = {
  target: 'target',
  aliasId: 'aliasId',
  isShown: true,
  onClose: () => undefined,
};

jest.mock('states/Navigator', () => ({
  reload: jest.fn(),
  reloadWithEnvironment: jest.fn().mockResolvedValue(null),
}));

const buildAliasChangedChoiceModal = (custom) => {
  const props = Object.assign(
    defaultChangedOptions,
    { currentEnvironmentId: 'oldTarget', newTargetIsMaster: false },
    custom
  );
  return render(<AliasChangedChoiceModal {...props} />);
};

const buildMasterAliasMovedModal = (custom) => {
  const props = Object.assign(
    defaultChangedOptions,
    { aliasId: 'master', currentEnvironmentId: 'newTarget' },
    custom
  );
  return render(<MasterAliasMovedModal {...props} />);
};

const buildAliasChangedInfoModal = (custom) => {
  const props = Object.assign(defaultChangedOptions, { currentEnvironmentId: 'newTarget' }, custom);
  return render(<AliasChangedInfoModal {...props} />);
};

const buildAliasDeletedInfoModal = (custom) => {
  const props = Object.assign(defaultCreatedOrDeletedOptions, custom);
  return render(<AliasDeletedInfoModal {...props} />);
};

describe('AliasChangedChoiceModal', () => {
  it('switches to new alias environment', async () => {
    const { getByTestId } = buildAliasChangedChoiceModal({ canManageEnvironments: true });
    const modal = getByTestId('aliaschangedchoicemodal.modal');
    expect(modal.innerHTML).toContain('Environment alias target changed');
    const button = getByTestId('switchtoaliasbutton.button.aliaschangedchoicemodal.modal');
    expect(button).toBeDefined();
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reload).toHaveBeenCalled());
    modal.remove();
  });

  it('stays on current environment', async () => {
    const { getByTestId } = buildAliasChangedChoiceModal({ canManageEnvironments: true });
    const modal = getByTestId('aliaschangedchoicemodal.modal');
    const button = getByTestId('continueeditingonenvironment.button.aliaschangedchoicemodal.modal');
    expect(button).toBeDefined();

    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('oldTarget'));
    modal.remove();
  });
});

describe('MasterAliasMovedModal', () => {
  it('shows modal when master points to the same env as the current', async () => {
    const { getByTestId } = buildMasterAliasMovedModal({
      isMaster: true,
      canManageEnvironments: false,
    });
    const modal = getByTestId('masteraliasmovedmodal.modal');
    expect(modal).toHaveTextContent('This environment is now targeted by the master alias');
    const button = getByTestId('continueediting.button.masteraliasmovedmodal.modal');
    act(() => {
      button.click();
    });
    modal.remove();
  });

  it('shows modal when master no longer points to the same env as the current', async () => {
    const { getByTestId } = buildMasterAliasMovedModal({
      isMaster: false,
      canManageEnvironments: false,
    });
    const modal = getByTestId('masteraliasmovedmodal.modal');
    expect(modal).toHaveTextContent('This environment is no longer targeted by the master alias');
    const button = getByTestId('continueediting.button.masteraliasmovedmodal.modal');
    act(() => {
      button.click();
    });
    expect(Navigator.reload).not.toHaveBeenCalledWith();
    modal.remove();
  });
});

describe('AliasChangedInfoModal', () => {
  it('stays on current environment when can not manage environments', async () => {
    const { getByTestId } = buildAliasChangedInfoModal({ canManageEnvironments: false });
    const modal = getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toHaveTextContent('You are now working on a different version of your space.');
    const button = getByTestId('continueediting.button.aliaschangedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toHaveBeenCalled());
    modal.remove();
  });
});

describe('AliasDeletedInfoModal', () => {
  it('shows deleted message with can manage environments', async () => {
    const { getByTestId } = buildAliasDeletedInfoModal();
    const modal = getByTestId('aliasdeletedinfomodal.modal');
    expect(modal).toHaveTextContent('Environment alias deleted');
    const button = getByTestId('continueediting.button.aliasdeletedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('target'));
    modal.remove();
  });
});
