import { render, screen } from '@testing-library/react';
import { AppDefinitionProps, AppInstallationProps } from 'contentful-management/types';
import { MarketplaceApp } from 'features/apps-core';
import noop from 'lodash/noop';
import React from 'react';
import { AppManager } from '../AppOperations';
import { AppDetails } from './AppDetails';
import { SpaceInformation } from './shared';
import { MemoryRouter } from 'core/react-routing';

jest.mock('core/components/ActionPerformerName', () => ({
  ActionPerformerName: ({ link }) => link.sys.id,
}));

describe('AppDetails', () => {
  const appManager = {} as AppManager;
  const app: MarketplaceApp = {
    id: 'optimizely',
    title: 'Optimizely',
    author: {
      name: 'Contentful',
      url: 'https://www.contentful.com',
      icon: '//images.ctfassets.net/lpjm8d10rkpy/4DxiiBjixHZVjc69WpJX95/4708b0bdc8e713faf69a667f8266d190/472182',
    },
    links: [
      {
        title: 'Documentation',
        shortTitle: 'Documentation',
        url: 'https://www.contentful.com/developers/docs/extensibility/apps/optimizely/',
      },
    ],
    icon: '//images.ctfassets.net/lpjm8d10rkpy/4X7O4Q0pIgQZNcONoQrQlp/9262ad9a935fa92e9cacd9207ae0a401/optimizely-logo.svg',
    categories: ['Featured', 'Personalization'],
    description: `# header

- item1
- item 2

The Optimizely app makes it easier to power experiments with structured content.`,
    supportUrl: '',
    legal: { eula: '', privacyPolicy: '' },
    appDefinition: {
      name: 'optimize',
      sys: {
        id: 'optimize-app-def-id',
      } as AppDefinitionProps['sys'],
    },
  };

  const spaceInformation: SpaceInformation = {
    spaceId: '',
    spaceName: '',
    envMeta: {
      environmentId: 'master',
      isMasterEnvironment: true,
    },
  };

  describe('Installation section', () => {
    it('should show if installed', () => {
      render(
        <MemoryRouter>
          <AppDetails
            app={{
              ...app,
              appInstallation: {
                sys: { createdAt: '2020-01-01', createdBy: { sys: { id: 'creator' } } },
              } as AppInstallationProps,
            }}
            appManager={appManager}
            spaceInformation={spaceInformation}
            onClose={noop}
            canManageApps
          />
        </MemoryRouter>
      );
      expect(screen.queryByText('Installed by creator')).toBeDefined();
    });

    it('should not show if not installed', () => {
      render(
        <MemoryRouter>
          <AppDetails
            spaceInformation={spaceInformation}
            app={app}
            appManager={appManager}
            onClose={noop}
            canManageApps
          />
        </MemoryRouter>
      );
      expect(screen.queryByText('Installed by')).toBeNull();
    });
  });

  describe('Support section', () => {
    it('should show correct text if supportUrl exists', () => {
      render(
        <MemoryRouter>
          <AppDetails
            app={{ ...app, supportUrl: 'https://www.contentful.com/support/ ' }}
            appManager={appManager}
            spaceInformation={spaceInformation}
            onClose={noop}
            canManageApps
          />
        </MemoryRouter>
      );
      expect(screen.queryByText('Contentful supports this app.')).toBeDefined();
    });

    it('should show correct text if supportUrl is missing', () => {
      render(
        <MemoryRouter>
          <AppDetails
            appManager={appManager}
            spaceInformation={spaceInformation}
            app={app}
            onClose={noop}
            canManageApps
          />
        </MemoryRouter>
      );
      expect(screen.queryByText('This app is not officially supported.')).toBeDefined();
    });
  });
});
