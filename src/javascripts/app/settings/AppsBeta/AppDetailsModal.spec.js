import React from 'react';
import { render, wait, cleanup } from '@testing-library/react';

import { AppDetails } from './AppDetailsModal';

jest.mock(
  'services/TokenStore',
  () => ({
    getDomains: () => ({
      images: ''
    })
  }),
  { virtual: true }
);

describe('AppDetailsModal', () => {
  const modalProps = {
    app: {
      installed: false,
      enabled: true,
      appId: 'optimizely',
      appName: 'Optimizely',
      author: {
        name: 'Contentful',
        url: 'https://www.contentful.com',
        icon:
          '//images.ctfassets.net/lpjm8d10rkpy/4DxiiBjixHZVjc69WpJX95/4708b0bdc8e713faf69a667f8266d190/472182'
      },
      links: [
        {
          title: 'Documentation',
          url: 'https://www.contentful.com/developers/docs/extensibility/apps/optimizely/'
        }
      ],
      icon:
        '//images.ctfassets.net/lpjm8d10rkpy/4X7O4Q0pIgQZNcONoQrQlp/9262ad9a935fa92e9cacd9207ae0a401/optimizely-logo.svg',
      categories: ['Featured', 'Personalization'],
      description: `# header

- item1
- item 2

The Optimizely app makes it easier to power experiments with structured content.`,
      permissions: 'The app has full permission to the space it is installed in.'
    },
    showPermissions: null,
    onClose: () => {}
  };

  afterEach(cleanup);

  it('should match the snapshot', async () => {
    const { container } = render(<AppDetails {...modalProps} />);

    await wait();

    expect(container).toMatchSnapshot();
  });
});
