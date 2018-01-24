import _ from 'lodash';
import { createElement as h } from 'libs/react';
import { mount } from 'libs/enzyme';
import sinon from 'npm:sinon';

import ChangeStateConfirmationDialog from 'app/entity_editor/ChangeStateConfirmationDialog/Component';
import { Action } from 'data/CMA/EntityActions';
import { EntityType, RequestState, NumberOfLinks } from 'app/entity_editor/ChangeStateConfirmationDialog/Component/constants';
import messages from 'app/entity_editor/ChangeStateConfirmationDialog/Component/Messages';

const sel = id => `[data-test-id="${id}"]`;

const getElement = (wrapper, id) => wrapper.find(sel(id));

const assertElementExists = (wrapper, id) =>
  expect(wrapper.find(sel(id)).exists()).toEqual(true);

describe('ChangeStateConfirmationDialog', () => {
  const defaultProps = {
    onCancel: _.noop,
    onConfirm: _.noop,
    action: Action.Unpublish(),
    links: [],
    requestState: RequestState.SUCCESS,
    entityInfo: {
      id: '',
      type: EntityType.ENTRY
    }
  };
  const render = props =>
    mount(h(ChangeStateConfirmationDialog, _.extend({}, defaultProps, props)));

  it('renders the dialog', () => {
    const wrapper = render();

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ZERO];

    assertElementExists(wrapper, 'state-change-confirmation-dialog');
    assertElementExists(wrapper, 'header');
    assertElementExists(wrapper, 'content');
    assertElementExists(wrapper, 'controls');
    assertElementExists(wrapper, 'confirm');
    assertElementExists(wrapper, 'cancel');

    expect(getElement(wrapper, 'header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'content').text()).toEqual(actionMessages.body);
    expect(getElement(wrapper, 'confirm').text()).toEqual(actionMessages.confirm);
  });

  it('renders the dialog with 1 link', () => {
    const links = [
      {
        title: 'Title',
        url: 'http://www.google1.com'
      }
    ];
    const wrapper = render({
      requestState: 'success',
      links
    });

    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ONE];

    assertElementExists(wrapper, 'state-change-confirmation-dialog');
    assertElementExists(wrapper, 'header');
    assertElementExists(wrapper, 'content');
    assertElementExists(wrapper, 'controls');
    assertElementExists(wrapper, 'confirm');
    assertElementExists(wrapper, 'cancel');

    expect(getElement(wrapper, 'header').text()).toEqual(actionMessages.title);
    expect(getElement(wrapper, 'content').find('p').text()).toEqual(actionMessages.body);
    expect(getElement(wrapper, 'confirm').text()).toEqual(actionMessages.confirm);
  });

  it('click on cancel triggers onCancel', () => {
    const onCancel = sinon.spy();
    const wrapper = render({
      onCancel
    });

    getElement(wrapper, 'cancel').simulate('click');
    sinon.assert.calledOnce(onCancel);
  });

  it('click on confirm triggers onConfirm', () => {
    const onConfirm = sinon.spy();
    const wrapper = render({
      onConfirm
    });

    getElement(wrapper, 'confirm').simulate('click');
    sinon.assert.calledOnce(onConfirm);
  });

  it('renders loading content if linked entries are not yet loaded', () => {
    const wrapper = render({
      requestState: 'pending'
    });

    assertElementExists(wrapper, 'loader');
  });

  it('renders error content if request failed', () => {
    const wrapper = render({
      requestState: 'error'
    });

    assertElementExists(wrapper, 'error');
  });

  it('renders the list of linked entries', () => {
    const links = [
      {
        title: '',
        url: 'http://www.google.com'
      },
      {
        title: 'Title',
        url: 'http://www.google1.com'
      }
    ];
    const wrapper = render({
      requestState: 'success',
      links
    });

    assertElementExists(wrapper, 'links');

    links.forEach((link, index) => {
      const el = getElement(wrapper, 'link').at(index);

      expect(el.props().href).toEqual(link.url);
      expect(el.props().target).toEqual('_blank');
      expect(el.props().title).toEqual(link.title || 'Untitled');
      expect(el.text()).toEqual(link.title || 'Untitled');
    });
  });

  it('does not render list of linked entries if there are no incoming links', () => {
    const actionMessages = messages[Action.Unpublish()][EntityType.ENTRY][NumberOfLinks.ZERO];
    const links = [];
    const wrapper = render({
      requestState: 'success',
      links
    });

    expect(getElement(wrapper, 'link').exists()).toBeFalsy();
    expect(getElement(wrapper, 'content').text()).toEqual(actionMessages.body);
  });
});
