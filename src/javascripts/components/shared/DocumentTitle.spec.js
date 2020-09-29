import React from 'react';
import { render, waitFor } from '@testing-library/react';

import DocumentTitle from './DocumentTitle';

import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { getSpace, space } from '__mocks__/ng/spaceContext';

describe('Document Title', () => {
  afterEach(() => {
    getSpace.mockClear();
  });

  it('supports string titles', async () => {
    getSpace.mockReturnValueOnce(null);

    render(
      <SpaceEnvContextProvider>
        <DocumentTitle title="Custom Title" />
      </SpaceEnvContextProvider>
    );

    await waitFor(() => expect(document.title).toEqual('Custom Title — Contentful'));
  });

  it('supports array titles', async () => {
    getSpace.mockReturnValueOnce(null);

    render(
      <SpaceEnvContextProvider>
        <DocumentTitle title={['Custom Title', 'Media']} />
      </SpaceEnvContextProvider>
    );

    await waitFor(() => expect(document.title).toEqual('Custom Title — Media — Contentful'));
  });

  it('appends space name when in space context', async () => {
    render(
      <SpaceEnvContextProvider>
        <DocumentTitle title="Custom Title" />
      </SpaceEnvContextProvider>
    );

    await waitFor(() => expect(document.title).toEqual('Custom Title — Blog — Contentful'));
  });

  it('appends current environment id if not master environment', async () => {
    getSpace.mockReturnValueOnce({
      ...space,
      environmentMeta: {
        isMasterEnvironment: false,
      },
      environment: {
        sys: {
          id: 'primary-1',
        },
      },
    });

    render(
      <SpaceEnvContextProvider>
        <DocumentTitle title="Custom Title" />
      </SpaceEnvContextProvider>
    );

    await waitFor(() =>
      expect(document.title).toEqual('Custom Title — Blog — primary-1 — Contentful')
    );
  });
});
