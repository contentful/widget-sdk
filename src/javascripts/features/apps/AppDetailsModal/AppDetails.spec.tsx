import { render, screen } from '@testing-library/react';
import noop from 'lodash/noop';
import React from 'react';
import { AppDetails } from './AppDetails';

jest.mock('core/components/ActionPerformerName', () => ({
  ActionPerformerName: ({ link }) => link.sys.id,
}));

describe('AppDetails', () => {
  const app = {
    id: 'optimizely',
    title: 'Optimizely',
    author: {
      name: 'Contentful',
      url: 'https://www.contentful.com',
      icon:
        '//images.ctfassets.net/lpjm8d10rkpy/4DxiiBjixHZVjc69WpJX95/4708b0bdc8e713faf69a667f8266d190/472182',
    },
    links: [
      {
        title: 'Documentation',
        url: 'https://www.contentful.com/developers/docs/extensibility/apps/optimizely/',
      },
    ],
    icon:
      '//images.ctfassets.net/lpjm8d10rkpy/4X7O4Q0pIgQZNcONoQrQlp/9262ad9a935fa92e9cacd9207ae0a401/optimizely-logo.svg',
    categories: ['Featured', 'Personalization'],
    description: `# header

- item1
- item 2

The Optimizely app makes it easier to power experiments with structured content.`,
    permissions: 'The app has full permission to the space it is installed in.',
  };

  describe('Installation section', () => {
    it('should show if installed', () => {
      render(
        <AppDetails
          app={{
            ...app,
            appInstallation: {
              sys: { createdBy: { sys: { id: 'creator' } } },
            },
          }}
          onClose={noop}
          canManageApps
        />
      );
      expect(screen.queryByText('Installed by creator')).toBeDefined();
    });

    it('should not show if not installed', () => {
      render(<AppDetails app={app} onClose={noop} canManageApps />);
      expect(screen.queryByText('Installed by')).toBeNull();
    });
  });

  describe('Support section', () => {
    it('should show correct text if supportUrl exists', () => {
      render(
        <AppDetails
          app={{ ...app, supportUrl: 'https://www.contentful.com/support/ ' }}
          onClose={noop}
          canManageApps
        />
      );
      expect(screen.queryByText('Contentful supports this app.')).toBeDefined();
    });

    it('should show correct text if supportUrl is missing', () => {
      render(<AppDetails app={app} onClose={noop} canManageApps />);
      expect(screen.queryByText('This app is not officially supported.')).toBeDefined();
    });
  });
});
