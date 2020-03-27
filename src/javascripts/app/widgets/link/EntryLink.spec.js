import React from 'react';
import { render, cleanup, wait, waitForElement } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import EntryLink from './EntryLink';

describe('EntryLink component', () => {
  const contentType = {
    data: {
      name: 'Article',
    },
  };

  const entryTitle = 'EntryTitle';

  const props = {
    entry: {
      sys: {
        id: 'entryId',
        type: 'Entry',
      },
    },
    getContentType: jest.fn().mockResolvedValue(contentType),
    entityHelpers: {
      entityTitle: jest.fn().mockResolvedValue(entryTitle),
      entityFile: jest.fn().mockResolvedValue(undefined),
      entityDescription: jest.fn().mockResolvedValue('Some lorem ipsum stuff'),
    },
  };

  afterEach(cleanup);

  it('should render the entry card', async () => {
    const { getByTestId, getByText } = render(<EntryLink {...props} />);
    await waitForElement(() => getByText('EntryTitle'));
    expect(getByTestId('content-type').textContent).toBe(contentType.data.name);
    expect(getByTestId('title').textContent).toBe(entryTitle);
  });

  it('should not render anything if entity type is not Entry', (done) => {
    const propsOverride = {
      ...props,
      entry: undefined,
    };
    const { queryByText } = render(<EntryLink {...propsOverride} />);
    wait(
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
    const { getByTestId } = render(<EntryLink {...propsOverrides} />);
    await waitForElement(() => getByTestId('title'));
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
    render(<EntryLink {...propsOverrides} />);
    await waitForElement(() =>
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
    const { queryByText } = render(<EntryLink {...propsOverrides} />);
    await waitForElement(() => queryByText('Awesome stuff'));
  });
});
