import initEnvAliasChangeHandler, {
  initEnvAliasCreateHandler,
  initEnvAliasDeleteHandler,
} from './NotificationsService';

import { Notification } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import * as accessChecker from 'access_control/AccessChecker';
import { window } from 'core/services/window';
import { screen } from '@testing-library/react';
import { when } from 'jest-when';

import { getModule } from 'core/NgRegistry';

// Global mock must be ignored.
// Also, ModalLauncher must be an arg to the called function, so the same actual function is tested
const { ModalLauncher } = jest.requireActual('core/components/ModalLauncher');

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

jest.mock('core/services/window', () => ({
  window: {
    location: {},
  },
}));

jest.mock('states/Navigator', () => ({
  reload: jest.fn(),
  reloadWithEnvironment: jest.fn().mockResolvedValue(null),
}));

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn().mockReturnValue(false),
}));

const changedUpdate = {
  newTarget: 'newTarget',
  oldTarget: 'oldTarget',
  aliasId: 'aliasId',
};

const createdOrDeletedUpdate = {
  target: 'newTarget',
  aliasId: 'aliasId',
};

describe('initEnvAliasChangeHandler', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open');
    jest.spyOn(Notification, 'warning');
  });

  it('triggers a notification and reload if changes not related', () => {
    window.location.pathname = '/spaces/content_types';
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('otherEnvironment'),
      });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    expect(Notification.warning).toHaveBeenCalledWith(
      'Your space admin has made changes to your space'
    );
    expect(Navigator.reload).toHaveBeenCalledWith();
  });

  it('triggers a notification and reload if not a content specific / environment aware page', () => {
    window.location.pathname = '/spaces/detail';
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    expect(Notification.warning).toHaveBeenCalledWith(
      'Your space admin has made changes to your space'
    );
    expect(Navigator.reload).toHaveBeenCalledWith();
  });

  it('triggers a modal if cannot manage environments', async () => {
    window.location.pathname = '/spaces/content_types';
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    const modal = screen.getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a modal if can manage environments', async () => {
    window.location.pathname = '/spaces/content_types';
    accessChecker.can.mockReturnValue(true);
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    const modal = screen.getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a modal if can manage environments and missing entity', async () => {
    window.location.pathname = '/spaces/content_types';
    accessChecker.can.mockReturnValue(true);
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    Navigator.reloadWithEnvironment.mockReturnValue('error');
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    const modal = screen.getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a notification and opens the changed info modal', async () => {
    window.location.pathname = '/spaces/content_types';
    accessChecker.can.mockReturnValue(true);
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    const modal = screen.getByTestId('aliaschangedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a notification and opens the changed choice modal', async () => {
    window.location.pathname = '/spaces/content_types';
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('oldTarget'),
      });
    accessChecker.can.mockReturnValue(true);
    const environmentAliasChangedHandler = initEnvAliasChangeHandler(ModalLauncher);
    environmentAliasChangedHandler(changedUpdate);
    const modal = screen.getByTestId('aliaschangedchoicemodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a notification and opens info modal with create event', async () => {
    window.location.pathname = '/spaces/content_types';
    accessChecker.can.mockReturnValue(true);
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasCreatedHandler = initEnvAliasCreateHandler(ModalLauncher);
    environmentAliasCreatedHandler(createdOrDeletedUpdate);
    const modal = screen.getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });

  it('triggers a notification and opens info modal with delete event', async () => {
    window.location.pathname = '/spaces/content_types';
    accessChecker.can.mockReturnValue(true);
    when(getModule)
      .calledWith('spaceContext')
      .mockReturnValue({
        getEnvironmentId: jest.fn().mockReturnValue('newTarget'),
      });
    const environmentAliasDeletedHandler = initEnvAliasDeleteHandler(ModalLauncher);
    environmentAliasDeletedHandler(createdOrDeletedUpdate);
    const modal = screen.getByTestId('aliascreatedordeletedinfomodal.modal');
    expect(modal).toBeDefined();
    modal.remove();
  });
});
