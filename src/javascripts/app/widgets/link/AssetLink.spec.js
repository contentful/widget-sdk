import React from 'react';
import { render, wait, waitForElement, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AssetLink from './AssetLink';

describe('AssetLink', () => {
  afterEach(cleanup);

  const props = {
    asset: {
      sys: {
        type: 'Asset'
      }
    },
    entityHelpers: {
      entityTitle: jest.fn().mockResolvedValue('AssetTitle'),
      assetFile: jest.fn().mockResolvedValue({
        contentType: 'image/jpeg',
        details: {
          image: {
            height: 400,
            width: 400
          }
        },
        fileName: 'dog-in-a-house-on-fire',
        url: '//google.com/dog-in-a-house-on-fire.jpg'
      })
    }
  };

  it('should render the asset card', async () => {
    const { getByText } = render(<AssetLink {...props} />);
    await waitForElement(() => getByText('AssetTitle'));
    const image = document.querySelector('img[alt="AssetTitle"]');
    expect(image.getAttribute('src')).toMatch(/^\/\/google.com\/dog-in-a-house-on-fire.jpg/);
  });

  it('should not render anything if entity type is not Asset', done => {
    const propsOverride = {
      ...props,
      asset: undefined
    };
    const { queryByText } = render(<AssetLink {...propsOverride} />);
    wait(
      () => {
        const item = queryByText('AssetTitle');
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
        entityTitle: jest.fn().mockResolvedValue(undefined)
      }
    };
    const { getByText } = render(<AssetLink {...propsOverrides} />);
    await waitForElement(() => getByText('Untitled'));
  });
});
