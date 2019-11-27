import { cleanup } from '@testing-library/react';
import initEnvAliasChangeHandler from './NotificationsService';
import '@testing-library/jest-dom/extend-expect';
import { Notification } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import * as accessChecker from 'access_control/AccessChecker';
import ModalLauncher from 'app/common/ModalLauncher';
import { setWindowLocationProperties } from '__mocks__/global/window';

jest.mock('@contentful/forma-36-react-components', () => ({
  Notification: { warning: jest.fn(), error: jest.fn() }
}));
jest.mock('states/Navigator', () => ({
  reload: jest.fn(),
  reloadWithEnvironment: jest.fn().mockResolvedValue(null)
}));
jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn().mockReturnValue(false)
}));
jest.mock('app/common/ModalLauncher', () => ({
  open: jest.fn().mockReturnValue()
}));

const update = {
  newTarget: 'newTarget',
  oldTarget: 'oldTarget',
  aliasId: 'aliasId'
};

describe('initEnvAliasChangeHandler', () => {
  afterEach(cleanup);
  beforeEach(() => {
    // handleAliasChanged.mockReset();
    Notification.warning.mockReset();
    Navigator.reload.mockReset();
    Navigator.reloadWithEnvironment.mockReset();
  });

  it('triggers a notification and reload if changes not related', () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('environmentId');
    environmentAliasChangedHandler(update);
    expect(Notification.warning).toHaveBeenCalledWith(
      'Your space admin has made changes to your space'
    );
    expect(Navigator.reload).toHaveBeenCalledWith();
  });

  it('triggers a notification and reload if not a content specific / environment aware page', () => {
    setWindowLocationProperties({ pathname: '/spaces/detail' });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('newTarget');
    environmentAliasChangedHandler(update);
    expect(Notification.warning).toHaveBeenCalledWith(
      'Your space admin has made changes to your space'
    );
    expect(Navigator.reload).toHaveBeenCalledWith();
  });

  it('triggers a modal if cannot manage environments', async () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('newTarget');
    environmentAliasChangedHandler(update);
    await expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('triggers a modal if can manage environments', async () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    accessChecker.can.mockReturnValue(true);
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('newTarget');
    environmentAliasChangedHandler(update);
    await expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('triggers a modal if can manage environments and missing entity', async () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    accessChecker.can.mockReturnValue(true);
    Navigator.reloadWithEnvironment.mockReturnValue('error');
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('newTarget');
    environmentAliasChangedHandler(update);
    await expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('triggers a notification and opens the choice modal', async () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    accessChecker.can.mockReturnValue(true);
    const environmentAliasChangedHandler = initEnvAliasChangeHandler('oldTarget');
    environmentAliasChangedHandler(update);
    await expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
