import _ from 'lodash';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';
import { assertElementExists, assertMessageEquals, getElement, flushPromises } from './helpers';

import { Action } from 'data/CMA/EntityActions.es6';
import { EntityType, NumberOfLinks } from 'app/entity_editor/Components/constants.es6';
import messages from 'app/entity_editor/Components/StateChangeConfirmationDialog/messages.es6';

describe('StateChangeConfirmationDialog', () => {
  const defaultProps = {
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
    const system = createIsolatedSystem();
    this.system = system;
    system.set('analytics/events/IncomingLinks.es6', {
      onFetchLinks: sinon.stub(),
      onDialogOpen: sinon.stub(),
      onDialogConfirm: sinon.stub(),
      onIncomingLinkClick: sinon.stub(),
      Origin: {
        DIALOG: 'dialog',
        SIDEBAR: 'sidebar'
      }
    });
    this.importModule = function* importModule(
      fetchLinksStub = sinon.stub().returns(Promise.resolve([]))
    ) {
      system.set('app/entity_editor/Components/FetchLinksToEntity/fetchLinks.es6', {
        default: fetchLinksStub
      });

      const { default: StateChangeConfirmationDialog } = yield system.import(
        'app/entity_editor/Components/StateChangeConfirmationDialog'
      );

      return StateChangeConfirmationDialog;
    };
  });

  afterEach(function() {
    delete this.system;
  });

  function render(Component, props) {
    return mount(<Component {...defaultProps} {...props} />);
  }

  it('renders the dialog with 0 links', function*() {
    const Component = yield* this.importModule();
    const wrapper = render(Component);
    yield flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ZERO];

    assertBasicElementsExist(wrapper);

    expect(getElement(wrapper, 'header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'content').text()).toEqual(actionMessages.body);
    expect(getElement(wrapper, 'confirm').text()).toEqual(actionMessages.confirm);
    expect(getElement(wrapper, 'link').exists()).toBeFalsy();
  });

  it('renders the dialog with 1 link', function*() {
    const links = [
      {
        id: 'link-id',
        title: 'Title',
        url: 'http://www.google1.com'
      }
    ];
    const Component = yield* this.importModule(sinon.stub().returns(Promise.resolve(links)));
    const wrapper = render(Component);
    yield flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ONE];

    assertBasicElementsExist(wrapper);

    assertMessageEquals(getContentText(wrapper), actionMessages.body);
    expect(getElement(wrapper, 'header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'confirm').text()).toEqual(actionMessages.confirm);
    assertLinksExist(wrapper, links);
  });

  it('renders the dialog with 1+ link', function*() {
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

    const Component = yield* this.importModule(sinon.stub().returns(Promise.resolve(links)));
    const wrapper = render(Component);
    yield flushPromises();
    wrapper.update();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.MANY];

    assertBasicElementsExist(wrapper);

    assertMessageEquals(getContentText(wrapper), actionMessages.body, {
      numberOfLinks: 2
    });
    expect(getElement(wrapper, 'header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'confirm').text()).toEqual(actionMessages.confirm);

    assertElementExists(wrapper, 'links');
    assertLinksExist(wrapper, links);
  });

  it('triggers `onCancel`', function*() {
    const Component = yield* this.importModule();
    const onCancel = sinon.spy();
    const wrapper = render(Component, {
      onCancel
    });
    yield flushPromises();
    wrapper.update();

    getElement(wrapper, 'cancel').simulate('click');
    sinon.assert.calledOnce(onCancel);
  });

  it('triggers `onConfirm`', function*() {
    const Component = yield* this.importModule();
    const onConfirm = sinon.spy();
    const wrapper = render(Component, {
      onConfirm
    });
    yield flushPromises();
    wrapper.update();

    getElement(wrapper, 'confirm').simulate('click');
    sinon.assert.calledOnce(onConfirm);
  });

  it('renders loading content if linked entries are not yet loaded', function*() {
    const Component = yield* this.importModule();
    const wrapper = render(Component);
    assertElementExists(wrapper, 'loader');
  });

  it('renders error content if request failed', function*() {
    const Component = yield* this.importModule(sinon.stub().returns(Promise.reject(new Error())));
    const wrapper = render(Component);
    yield flushPromises();
    wrapper.update();

    assertElementExists(wrapper, 'error');
  });
});

function getContentText(wrapper) {
  return getElement(wrapper, 'content')
    .find('p')
    .text();
}

function assertBasicElementsExist(wrapper) {
  assertElementExists(wrapper, 'state-change-confirmation-dialog');
  assertElementExists(wrapper, 'header');
  assertElementExists(wrapper, 'content');
  assertElementExists(wrapper, 'controls');
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
