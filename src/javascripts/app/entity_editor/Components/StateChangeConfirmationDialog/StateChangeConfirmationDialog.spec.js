import _ from 'lodash';
import React from 'react';

import { Action } from 'data/CMA/EntityActions';
import { EntityType, NumberOfLinks } from 'app/entity_editor/Components/constants';
import messages from 'app/entity_editor/Components/StateChangeConfirmationDialog/messages';

import StateChangeConfirmationDialog from 'app/entity_editor/Components/StateChangeConfirmationDialog';
import * as IncomingLinks from 'analytics/events/IncomingLinks';
import * as FetchLinks from 'app/entity_editor/Components/FetchLinksToEntity/fetchLinks';
import { render, waitFor } from '@testing-library/react';

jest.mock('analytics/events/IncomingLinks');
jest.mock('app/entity_editor/Components/FetchLinksToEntity/fetchLinks');

const assertElementExists = (wrapper, id) => {
  expect(wrapper.queryByTestId(id)).toBeInTheDocument();
};

const assertMessageEquals = (text, message, args) => {
  expect(text).toContain(_.template(message)(args));
};

const getElement = (wrapper, id) => wrapper.queryByTestId(id);

describe('StateChangeConfirmationDialog', () => {
  const defaultProps = {
    isShown: true,
    onCancel: _.noop,
    onConfirm: _.noop,
    onArchive: _.noop,
    action: Action.Unpublish(),
    entityInfo: {
      id: 'entry-id-257',
      type: EntityType.ENTRY,
    },
    dialogSessionId: 'foo',
  };

  beforeEach(function () {
    IncomingLinks.onFetchLinks = jest.fn();
    IncomingLinks.onDialogOpen = jest.fn();
    IncomingLinks.onDialogConfirm = jest.fn();
    IncomingLinks.onIncomingLinkClick = jest.fn();
    IncomingLinks.Origin = {
      DIALOG: 'dialog',
      SIDEBAR: 'sidebar',
    };
  });

  function renderComponent(props = {}, fetchLinksStub = jest.fn().mockResolvedValue([])) {
    FetchLinks.default = fetchLinksStub;
    return render(<StateChangeConfirmationDialog {...defaultProps} {...props} />);
  }

  it('renders the dialog with 0 links', async function () {
    const wrapper = renderComponent();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ZERO];
    assertBasicElementsExist(wrapper);
    await waitFor(() => {
      expect(getElement(wrapper, 'cf-ui-modal-header').innerHTML).toContain(actionMessages.title);
    });
    expect(getElement(wrapper, 'cf-ui-modal-content').innerHTML).toContain(actionMessages.body);

    expect(getElement(wrapper, 'confirm').innerHTML).toContain(actionMessages.confirm);
    expect(getElement(wrapper, 'link')).not.toBeInTheDocument();
  });

  it('renders the dialog with 1 link', async function () {
    const links = [
      {
        id: 'link-id',
        title: 'Title',
        url: 'http://www.google1.com',
      },
    ];
    const wrapper = renderComponent({}, jest.fn().mockResolvedValue(links));

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ONE];
    assertBasicElementsExist(wrapper);

    await waitFor(() => {
      expect(getElement(wrapper, 'cf-ui-modal-header').innerHTML).toContain(actionMessages.title);
    });

    assertMessageEquals(getContentText(wrapper), actionMessages.body);
    expect(getElement(wrapper, 'confirm').innerHTML).toContain(actionMessages.confirm);
    assertLinksExist(wrapper, links);
  });

  it('renders the dialog with 1+ link', async function () {
    const links = [
      {
        id: 'link-id',
        title: 'Title',
        url: 'http://www.google1.com',
      },
      {
        id: 'link-id-2',
        title: 'Title 2',
        url: 'http://www.google13.com',
      },
    ];

    const wrapper = renderComponent({}, jest.fn().mockResolvedValue(links));

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.MANY];

    assertBasicElementsExist(wrapper);

    await waitFor(() => {
      expect(getElement(wrapper, 'cf-ui-modal-header').innerHTML).toContain(actionMessages.title);
    });
    assertMessageEquals(getContentText(wrapper), actionMessages.body, {
      numberOfLinks: 2,
    });
    expect(getElement(wrapper, 'confirm').innerHTML).toContain(actionMessages.confirm);

    assertElementExists(wrapper, 'links');
    assertLinksExist(wrapper, links);
  });

  it('triggers `onCancel`', async function () {
    const onCancel = jest.fn();
    const wrapper = renderComponent({
      onCancel,
    });

    getElement(wrapper, 'cancel').click();
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });

  it('triggers `onConfirm`', async function () {
    const onConfirm = jest.fn();
    const wrapper = renderComponent({
      onConfirm,
    });

    await waitFor(() => getElement(wrapper, 'loader')?.not.toBeInTheDocument());
    getElement(wrapper, 'confirm').click();
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('renders loading content if linked entries are not yet loaded', async function () {
    const wrapper = renderComponent();
    assertElementExists(wrapper, 'loader');
  });

  it('renders error content if request failed', async function () {
    const wrapper = renderComponent({}, jest.fn().mockRejectedValue(new Error()));

    await waitFor(() => assertElementExists(wrapper, 'error'));
  });
});

function getContentText(wrapper) {
  return getElement(wrapper, 'cf-ui-modal-content')?.querySelector('p')?.innerHTML || '';
}

function assertBasicElementsExist(wrapper) {
  assertElementExists(wrapper, 'state-change-confirmation-dialog');
  assertElementExists(wrapper, 'cf-ui-modal-header');
  assertElementExists(wrapper, 'cf-ui-modal-content');
  assertElementExists(wrapper, 'cf-ui-modal-controls');
  assertElementExists(wrapper, 'confirm');
  assertElementExists(wrapper, 'cancel');
}

function assertLinksExist(wrapper, links) {
  const linkElements = wrapper.queryAllByTestId('link');
  expect(linkElements).toHaveLength(links.length);
  links.forEach((link, index) => {
    const el = linkElements[index];
    expect(el.getAttribute('href')).toEqual(link.url);
    expect(el.getAttribute('target')).toEqual('_blank');
    expect(el.getAttribute('title')).toEqual(link.title || 'Untitled');
    expect(el.innerHTML).toContain(link.title || 'Untitled');
  });
}
