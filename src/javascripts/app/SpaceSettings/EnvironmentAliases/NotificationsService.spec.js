import ReactDOM from 'react-dom';
import initEnvAliasChangeHandler from './NotificationsService';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { Notification } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import { window } from 'core/services/window';
import { cleanup, screen } from '@testing-library/react';
import { when } from 'jest-when';
import * as accessChecker from 'access_control/AccessChecker';
import { getModule } from 'core/NgRegistry';
import { initEnvAliasDeleteHandler } from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

jest.mock('core/services/window', () => ({
  window: {
    location: { pathname: '' },
  },
}));

jest.mock('states/Navigator', () => ({
  reload: jest.fn(),
  reloadWithEnvironment: jest.fn().mockResolvedValue(null),
}));

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn().mockReturnValue(false),
}));

const changeModalOnScreen = () => screen.queryByTestId('aliaschangedchoicemodal.modal');
const infoModalOnScreen = () => screen.queryByTestId('aliaschangedinfomodal.modal');
const deleteModalOnScreen = () => screen.queryByTestId('aliasdeletedinfomodal.modal');

const mockSpaceContextWithEnv = (environment, alias) => {
  when(getModule)
    .calledWith('spaceContext')
    .mockReturnValue({
      isMasterEnvironmentById: jest.fn().mockReturnValue(true),
      getEnvironmentId: jest.fn().mockReturnValue(environment),
      space: { environmentMeta: { environmentId: environment, aliasId: alias } },
    });
};

const mockEnvAccess = (canAccess) => {
  when(accessChecker.can).calledWith('manage', 'Environments').mockReturnValue(canAccess);
};

const setupChangeHandler = (oldTarget, newTarget, aliasId) => {
  initEnvAliasChangeHandler(ModalLauncher)({
    newTarget: newTarget,
    oldTarget: oldTarget,
    aliasId: aliasId,
  });
};

const setupDeleteHandler = (target, aliasId) => {
  initEnvAliasDeleteHandler(ModalLauncher)({
    target: target,
    aliasId: aliasId,
  });
};

const CONTENT_ROUTE = '/spaces/entries';

const setupRoute = (route) => {
  window.location.pathname = route;
};

describe('NotificationService', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open');
    jest.spyOn(Notification, 'warning');
  });

  afterEach(async () => {
    document.querySelectorAll('*[id^="modals-root"]').forEach((root) => {
      ReactDOM.unmountComponentAtNode(root);
      root.remove();
      return cleanup();
    });
  });

  describe('with an initEnvAliasChangeHandler listening to alias target change event', () => {
    describe('and can manage all environments', () => {
      it('shows nothing when new alias has no old target', () => {
        mockSpaceContextWithEnv('currentEnvironment', null);
        setupChangeHandler(null, 'newEnvironment', 'currentAlias');
        expect(changeModalOnScreen()).toBeNull();
        expect(Notification.warning).not.toHaveBeenCalled();
        expect(Navigator.reload).not.toHaveBeenCalledWith();
      });

      it('shows modal to stay on alias or switch to target env when on content relevant route', () => {
        setupRoute(CONTENT_ROUTE);
        mockEnvAccess(true);
        mockSpaceContextWithEnv('currentEnvironment', 'currentAlias');
        setupChangeHandler('currentEnvironment', 'newEnvironment', 'currentAlias');
        expect(changeModalOnScreen()).not.toBeNull();
        expect(Notification.warning).not.toHaveBeenCalled();
        expect(Navigator.reload).not.toHaveBeenCalledWith();
      });
    });

    describe('and can not manage all environments', () => {
      it('shows info modal when master alias target changes', () => {
        mockEnvAccess(false);
        mockSpaceContextWithEnv('currentEnvironment', 'master');
        setupChangeHandler('currentEnvironment', 'newEnvironment', 'master');
        expect(infoModalOnScreen()).not.toBeNull();
        expect(Notification.warning).not.toHaveBeenCalled();
        expect(Navigator.reload).not.toHaveBeenCalledWith();
      });
    });
  });

  describe('with an initEnvAliasDeleteHandler', () => {
    describe('on alias delete', () => {
      it('show info modal when alias deleted for current env and when on content relevant route', () => {
        mockEnvAccess(true);
        window.location.pathname = '/spaces/content_types';
        mockSpaceContextWithEnv('currentEnvironment', 'currentAlias');
        setupDeleteHandler('currentEnvironment', 'currentAlias');
        expect(deleteModalOnScreen()).not.toBeNull();
        expect(Notification.warning).not.toHaveBeenCalled();
        expect(Navigator.reload).not.toHaveBeenCalledWith();
      });
    });
  });
});
