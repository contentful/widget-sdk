import React from 'react';
import { mount } from 'enzyme';
import { EntityType } from 'app/entity_editor/Components/constants';

import * as FetchLinks from 'app/entity_editor/Components/FetchLinksToEntity/fetchLinks';
import * as Analytics from 'analytics/events/IncomingLinks';
import FetchLinksToEntity from './index';
import { waitFor } from '@testing-library/dom';

jest.mock('app/entity_editor/Components/FetchLinksToEntity/fetchLinks');
jest.mock('analytics/events/IncomingLinks');

describe('FetchLinksToEntity', () => {
  const defaultProps = {
    id: 'entry-id',
    type: EntityType.ENTRY,
    origin: 'sidebar',
  };

  let importModule, onFetchLinks;
  beforeEach(function () {
    onFetchLinks = jest.fn();
    Analytics.onFetchLinks = onFetchLinks;
    Analytics.Origin = {
      DIALOG: 'dialog',
      SIDEBAR: 'sidebar',
    };

    importModule = function ({ fetchLinksStub }) {
      FetchLinks.default = fetchLinksStub;
      return FetchLinksToEntity;
    };
  });

  function render(Component, props) {
    return mount(<Component {...defaultProps} {...props} />);
  }

  it('passes pending state on initial render', async function () {
    const fetchLinksStub = jest.fn().mockReturnValue(Promise.resolve([]));
    const Component = importModule({ fetchLinksStub });

    const renderFunc = jest.fn().mockReturnValue(null);
    render(Component, { render: renderFunc });

    expect(renderFunc).toHaveBeenCalledWith({ links: [], requestState: 'pending' });
  });

  it('passes success state and links if api called returns data', async function () {
    const links = [{ id: 1 }, { id: 2 }];
    const fetchLinksStub = jest.fn().mockImplementation((arg1, arg2) => {
      if (arg1 === defaultProps.id && arg2 === defaultProps.type) {
        return Promise.resolve(links);
      }
    });

    const Component = importModule({ fetchLinksStub });

    const renderFunc = jest.fn().mockReturnValue(null);
    render(Component, { render: renderFunc });

    await waitFor(() =>
      expect(renderFunc).toHaveBeenNthCalledWith(2, {
        links,
        requestState: 'success',
      })
    );
    expect(onFetchLinks).not.toBeCalled();
  });

  it('passes error state and empty links if api fails to return data', async function () {
    const fetchLinksStub = jest.fn().mockImplementation((arg1, arg2) => {
      if (arg1 === defaultProps.id && arg2 === defaultProps.type) {
        return Promise.reject(new Error());
      }
    });

    const Component = importModule({ fetchLinksStub });

    const renderFunc = jest.fn().mockReturnValue(null);
    render(Component, { render: renderFunc });

    await waitFor(() =>
      expect(renderFunc).toHaveBeenNthCalledWith(2, {
        links: [],
        requestState: 'error',
      })
    );
  });
});
