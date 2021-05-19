import React from 'react';
import { render, wait } from '@testing-library/react';
import { noop } from 'lodash';

import { AppDetails } from './AppDetails';
import { AppManager } from '../AppOperations';
import { MarketplaceApp } from 'features/apps-core';

jest.mock('services/TokenStore', () => ({
  getDomains: () => ({
    images: '',
  }),
}));

describe('AppDetailsModal', () => {
  const appManager = {} as AppManager;
  const modalProps = {
    app: {
      id: 'optimizely',
      title: 'Optimizely',
      appDefinition: {
        name: 'optimizely',
        sys: {
          id: 'optimizely-app-id',
        },
      },
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
      permissions: 'The app has full permission to the space it is installed in.',
      supportUrl: '',
    } as unknown as MarketplaceApp,
    showPermissions: false,
    onClose: noop,
    canManageApps: true,
    spaceInformation: {
      spaceId: 'some-space',
      spaceName: 'space-name',
      envMeta: {
        environmentId: 'master',
        isMasterEnvironment: true,
      },
    },
  };

  it('should match the snapshot', async () => {
    const { container } = render(<AppDetails appManager={appManager} {...modalProps} />);

    await wait();

    expect(container).toMatchSnapshot();
  });
});
