import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import EntryLink from './EntryLink';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const contentType = {
  sys: {
    id: 'content-type',
  },
  name: 'Article',
};

const entryTitle = 'EntryTitle';

const props = {
  entry: {
    sys: {
      id: 'entryId',
      type: 'Entry',
      contentType: {
        sys: {
          id: contentType.sys.id,
        },
      },
    },
  },
  entityHelpers: {
    entityTitle: jest.fn().mockResolvedValue(entryTitle),
    entityFile: jest.fn().mockResolvedValue(undefined),
    entityDescription: jest.fn().mockResolvedValue('Some lorem ipsum stuff'),
  },
};

const build = (props) => {
  const value = {
    currentSpaceContentTypes: [contentType],
  };

  return render(
    <SpaceEnvContext.Provider value={value}>
      <EntryLink {...props} />
    </SpaceEnvContext.Provider>
  );
};

describe('EntryLink component', () => {
  it('should render the entry card', async () => {
    const { getByTestId, getByText } = build(props);
    await waitFor(() => getByText('EntryTitle'));
    expect(getByTestId('content-type').textContent).toBe(contentType.name);
    expect(getByTestId('title').textContent).toBe(entryTitle);
  });

  it('should not render anything if entity type is not Entry', (done) => {
    const propsOverride = {
      ...props,
      entry: undefined,
    };
    const { queryByText } = build(propsOverride);
    waitFor(
      () => {
        const item = queryByText(entryTitle);
        expect(item).toBeNull();
        done();
      },
      { timeout: 500 }
    );
  });

  it('Falls back to Untitled if entry title was not provided', async () => {
    const propsOverrides = {
      ...props,
      entityHelpers: {
        ...props.entityHelpers,
        entityTitle: jest.fn().mockResolvedValue(undefined),
      },
    };
    const { getByTestId } = build(propsOverrides);
    await waitFor(() => getByTestId('title'));
    expect(getByTestId('title').textContent).toBe('Untitled');
  });

  it('should set size to default if given a file', async () => {
    const propsOverrides = {
      ...props,
      entityHelpers: {
        ...props.entityHelpers,
        entityFile: jest.fn().mockResolvedValue({
          contentType: 'image/jpeg',
          details: {
            image: {
              height: 400,
              width: 400,
            },
          },
          fileName: 'dog-in-a-house-on-fire',
          url: '//google.com/dog-in-a-house-on-fire.jpg',
        }),
      },
    };
    build(propsOverrides);
    await waitFor(() =>
      document.querySelector(`img[src*="//google.com/dog-in-a-house-on-fire.jpg"]`)
    );
  });

  it('should set size to default if given a description', async () => {
    const propsOverrides = {
      ...props,
      entityHelpers: {
        ...props.entityHelpers,
        entityDescription: jest.fn().mockResolvedValue('Awesome stuff'),
      },
    };
    const { queryByText } = build(propsOverrides);
    await waitFor(() => queryByText('Awesome stuff'));
  });
});
