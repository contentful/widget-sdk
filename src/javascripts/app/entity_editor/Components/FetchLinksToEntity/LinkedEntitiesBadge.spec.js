import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LinkedEntitiesBadge from './LinkedEntitiesBadge';
import { Promise } from 'bluebird';
import * as slideInNavigator from 'navigation/SlideInNavigator';

import fetchLinks from 'app/entity_editor/Components/FetchLinksToEntity/fetchLinks';

jest.mock('navigation/SlideInNavigator', () => ({
  goToSlideInEntity: jest.fn()
}));

jest.mock('app/entity_editor/Components/FetchLinksToEntity/fetchLinks', () => jest.fn());

jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({
    code: 'en-US'
  }),
  toInternalCode: () => jest.fn()
}));

const mockedLinks = [
  {
    id: 'id1',
    title: 'title1',
    contentTypeName: 'contentTypeName1',
    url: 'url1'
  },
  {
    id: 'id2',
    title: 'title2',
    contentTypeName: 'contentTypeName2',
    url: 'url2'
  }
];

describe('LinkedEntitiesBadge', () => {
  const build = props => {
    const resultProps = {
      entityInfo: {
        id: 'entityId',
        type: 'Entry'
      }
    };

    return [render(<LinkedEntitiesBadge {...resultProps} />), props];
  };

  it('renders the component with 2 linked entries', async () => {
    fetchLinks.mockImplementation(() => Promise.resolve(mockedLinks));
    const [renderResult] = build();
    await wait();
    fireEvent.mouseOver(renderResult.getByTestId('cf-linked-entities-icon'));
    expect(renderResult).toMatchSnapshot();
  });

  it('does not render with 1 linked entry', async () => {
    fetchLinks.mockImplementation(() => Promise.resolve([mockedLinks[0]]));
    const [renderResult] = build();
    await wait();
    expect(renderResult).toMatchSnapshot();
  });

  it('does not render the component if no links are present', async () => {
    fetchLinks.mockImplementation(() => Promise.resolve([]));
    const [renderResult] = build();
    await wait();
    expect(renderResult).toMatchSnapshot();
  });

  it('opens the entry in a slide in editor', async () => {
    fetchLinks.mockImplementation(() => Promise.resolve(mockedLinks));
    const [renderResult] = build();
    await wait();
    fireEvent.mouseOver(renderResult.getByTestId('cf-linked-entities-icon'));
    fireEvent.click(renderResult.getByTestId(`cf-linked-entry-${mockedLinks[0].id}`));
    expect(slideInNavigator.goToSlideInEntity).toHaveBeenCalledWith({
      type: 'Entry',
      id: mockedLinks[0].id
    });
  });
});
