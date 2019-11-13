import _ from 'lodash';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { assertElementExists, assertMessageEquals, getElement } from 'test/utils/expectations';

import { Action } from 'data/CMA/EntityActions';
import { EntityType, NumberOfLinks } from 'app/entity_editor/Components/constants';
import messages from 'app/entity_editor/Components/StateChangeConfirmationDialog/messages';

import flushPromises from 'test/utils/flushPromises';

describe('StateChangeConfirmationDialog', () => {
  const defaultProps = {
    isShown: true,
    onCancel: _.noop,
    onConfirm: _.noop,
    action: Action.Unpublish(),
    entityInfo: {
      id: 'entry-id-257',
      type: EntityType.ENTRY
    },
    dialogSessionId: 'foo'
  };

  beforeEach(function() {
    this.system.set('analytics/events/IncomingLinks', {
      onFetchLinks: sinon.stub(),
      onDialogOpen: sinon.stub(),
      onDialogConfirm: sinon.stub(),
      onIncomingLinkClick: sinon.stub(),
      Origin: {
        DIALOG: 'dialog',
        SIDEBAR: 'sidebar'
      }
    });

    const system = this.system;

    this.importModule = async function importModule(
      fetchLinksStub = sinon.stub().returns(Promise.resolve([]))
    ) {
      system.set('app/entity_editor/Components/FetchLinksToEntity/fetchLinks', {
        default: fetchLinksStub
      });

      const { default: StateChangeConfirmationDialog } = await system.import(
        'app/entity_editor/Components/StateChangeConfirmationDialog'
      );

      return StateChangeConfirmationDialog;
    };
  });

  function render(Component, props) {
    return mount(<Component {...defaultProps} {...props} />);
  }

  it('renders the dialog with 0 links', async function() {
    const Component = await this.importModule();
    const wrapper = render(Component);
    await flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ZERO];

    assertBasicElementsExist(wrapper);

    expect(getElement(wrapper, 'cf-ui-modal-header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'cf-ui-modal-content').text()).toEqual(actionMessages.body);

    expect(getElement(wrapper, 'confirm').text()).toContain(actionMessages.confirm);
    expect(getElement(wrapper, 'link').exists()).toBeFalsy();
  });

  it('renders the dialog with 1 link', async function() {
    const links = [
      {
        id: 'link-id',
        title: 'Title',
        url: 'http://www.google1.com'
      }
    ];
    const Component = await this.importModule(sinon.stub().returns(Promise.resolve(links)));
    const wrapper = render(Component);
    await flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ONE];

    assertBasicElementsExist(wrapper);

    assertMessageEquals(getContentText(wrapper), actionMessages.body);
    expect(getElement(wrapper, 'cf-ui-modal-header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'confirm').text()).toContain(actionMessages.confirm);
    assertLinksExist(wrapper, links);
  });

  it('renders the dialog with 1+ link', async function() {
    const links = [
      {
        id: 'link-id',
        title: 'Title',
        url: 'http://www.google1.com'
      },
      {
        id: 'link-id-2',
        title: 'Title 2',
        url: 'http://www.google13.com'
      }
    ];

    const Component = await this.importModule(sinon.stub().returns(Promise.resolve(links)));
    const wrapper = render(Component);
    await flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.MANY];

    assertBasicElementsExist(wrapper);

    assertMessageEquals(getContentText(wrapper), actionMessages.body, {
      numberOfLinks: 2
    });
    expect(getElement(wrapper, 'cf-ui-modal-header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'confirm').text()).toContain(actionMessages.confirm);

    assertElementExists(wrapper, 'links');
    assertLinksExist(wrapper, links);
  });

  it('triggers `onCancel`', async function() {
    const Component = await this.importModule();
    const onCancel = sinon.spy();
    const wrapper = render(Component, {
      onCancel
    });
    await flushPromises();
    wrapper.update();

    getElement(wrapper, 'cancel').simulate('click');
    sinon.assert.calledOnce(onCancel);
  });

  it('triggers `onConfirm`', async function() {
    const Component = await this.importModule();
    const onConfirm = sinon.spy();
    const wrapper = render(Component, {
      onConfirm
    });
    await flushPromises();
    wrapper.update();

    getElement(wrapper, 'confirm').simulate('click');
    sinon.assert.calledOnce(onConfirm);
  });

  it('renders loading content if linked entries are not yet loaded', async function() {
    const Component = await this.importModule();
    const wrapper = render(Component);
    assertElementExists(wrapper, 'loader');
  });

  it('renders error content if request failed', async function() {
    const Component = await this.importModule(sinon.stub().returns(Promise.reject(new Error())));
    const wrapper = render(Component);
    await flushPromises();
    wrapper.update();

    assertElementExists(wrapper, 'error');
  });
});

function getContentText(wrapper) {
  return getElement(wrapper, 'cf-ui-modal-content')
    .find('p')
    .text();
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
  expect(getElement(wrapper, 'link').length).toBe(links.length);
  links.forEach((link, index) => {
    const el = getElement(wrapper, 'link').at(index);

    expect(el.props().href).toEqual(link.url);
    expect(el.props().target).toEqual('_blank');
    expect(el.props().title).toEqual(link.title || 'Untitled');
    expect(el.text()).toEqual(link.title || 'Untitled');
  });
}
