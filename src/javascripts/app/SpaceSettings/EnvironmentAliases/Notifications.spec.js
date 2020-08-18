import React from 'react';
import { render } from '@testing-library/react';
import {
  AliasChangedChoiceModal,
  AliasChangedInfoModal,
  AliasCreatedOrDeletedInfoModal,
} from './Notifications';
import { act, waitFor } from '@testing-library/react';
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
  const props = Object.assign(defaultChangedOptions, { currentEnvironmentId: 'oldTarget' }, custom);
  return render(<AliasChangedChoiceModal {...props} />);
};

const buildAliasChangedInfoModal = (custom) => {
  const props = Object.assign(defaultChangedOptions, { currentEnvironmentId: 'newTarget' }, custom);
  return render(<AliasChangedInfoModal {...props} />);
};

const buildAliasCreatedOrDeletedInfoModal = (custom) => {
  const props = Object.assign(defaultCreatedOrDeletedOptions, custom);
  return render(<AliasCreatedOrDeletedInfoModal {...props} />);
};

describe('AliasChangedChoiceModal', () => {
  it('switches to new alias environment', async () => {
    const { getByTestId } = buildAliasChangedChoiceModal();
    const modal = getByTestId('aliaschangedchoicemodal.modal');
    expect(modal.innerHTML).toContain('Your space admin has made changes to your space');
    const button = getByTestId('switchtoaliasbutton.button.aliaschangedchoicemodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('newTarget'));
    modal.remove();
  });

  it('stays on current environment', async () => {
    const { getByTestId } = buildAliasChangedChoiceModal();
    const modal = getByTestId('aliaschangedchoicemodal.modal');
    const button = getByTestId('continueeditingonenvironment.button.aliaschangedchoicemodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('oldTarget'));
    modal.remove();
  });
});

describe('AliasChangedInfoModal', () => {
  it('stays on current environment when can manage environments', async () => {
    const { getByTestId } = buildAliasChangedInfoModal({ canManageEnvironments: true });
    const modal = getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toHaveTextContent(
      'Any changes you’ve made will continue to be reflected on aliasId.'
    );
    const button = getByTestId('continueediting.button.aliaschangedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('newTarget'));
    modal.remove();
  });

  it('stays on current environment when can not manage environments', async () => {
    const { getByTestId } = buildAliasChangedInfoModal({ canManageEnvironments: false });
    const modal = getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toHaveTextContent('You are now working on a different version of your space.');
    const button = getByTestId('continueediting.button.aliaschangedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('newTarget'));
    modal.remove();
  });
});

describe('AliasCreatedOrDeletedInfoModal', () => {
  it('shows created message with can manage environments', async () => {
    const { getByTestId } = buildAliasCreatedOrDeletedInfoModal({
      action: 'create',
      canManageEnvironments: true,
    });
    const modal = getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toHaveTextContent(
      'your space admin created the aliasId alias on your current environment target.'
    );
    const button = getByTestId('continueediting.button.aliascreatedordeletedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('target'));
    modal.remove();
  });

  it('shows created message with can not manage environments', async () => {
    const { getByTestId } = buildAliasCreatedOrDeletedInfoModal({
      action: 'create',
      canManageEnvironments: false,
    });
    const modal = getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toHaveTextContent('You are now working on a different version of your space.');
    const button = getByTestId('continueediting.button.aliascreatedordeletedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('target'));
    modal.remove();
  });

  it('shows deleted message with can manage environments', async () => {
    const { getByTestId } = buildAliasCreatedOrDeletedInfoModal({
      action: 'delete',
      canManageEnvironments: true,
    });
    const modal = getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toHaveTextContent(
      'your space admin deleted the aliasId alias on your current environment target.'
    );
    const button = getByTestId('continueediting.button.aliascreatedordeletedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('target'));
    modal.remove();
  });

  it('shows deleted message with can not manage environments', async () => {
    const { getByTestId } = buildAliasCreatedOrDeletedInfoModal({
      action: 'delete',
      canManageEnvironments: false,
    });
    const modal = getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toHaveTextContent('You are now working on a different version of your space.');
    const button = getByTestId('continueediting.button.aliascreatedordeletedinfomodal.modal');
    act(() => {
      button.click();
    });
    await waitFor(() => expect(Navigator.reloadWithEnvironment).toBeCalledWith('target'));
    modal.remove();
  });
});
