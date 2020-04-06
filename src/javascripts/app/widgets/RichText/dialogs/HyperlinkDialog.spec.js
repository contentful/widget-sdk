import React from 'react';
import { mount } from 'enzyme';
import 'jest-enzyme';

import { HyperlinkDialogForm } from './HyperlinkDialog';

jest.mock('ui/Framework/AngularComponent', () => () => null);
jest.mock('NgRegistry', () => ({ getModule: jest.fn().mockImplementation(() => null) }));
jest.mock('directives/thumbnailHelpers', () => ({}));

jest.mock('search/EntitySelector/Config', () => ({
  getLabels: () => ({
    title: '',
    input: '',
    info: '',
    empty: '',
    searchPlaceholder: '',
  }),
  calculateIdealListHeight: () => 200,
}));

describe('HyperlinkDialog', () => {
  const selectors = {
    confirmCta: 'button[data-test-id="confirm-cta"]',
    cancelCta: 'button[data-test-id="cancel-cta"]',
    linkTextInput: 'input[data-test-id="link-text-input"]',
    linkUriInput: 'input[data-test-id="link-uri-input"]',
    linkTypeSelect: 'select[data-test-id="link-type-select"]',
    linkTypeSelectOptions: 'select[data-test-id="link-type-select"] option',
    entitySelector: '[data-test-id="entity-selector-container"]',
    fetchedEntityCard: '[data-test-id="cf-ui-reference-card"]',
  };

  it('allows the user to add a hyperlink to a URL', async function () {
    const mockOnConfirm = jest.fn();

    const wrapper = mount(<HyperlinkDialogForm onConfirm={mockOnConfirm} onCancel={() => {}} />);

    expect(wrapper.find(selectors.confirmCta)).toBeDisabled();
    wrapper.find(selectors.confirmCta).simulate('click');

    expect(mockOnConfirm).not.toHaveBeenCalled();

    wrapper.find(selectors.linkTextInput).simulate('change', { target: { value: 'My text link' } });
    wrapper
      .find(selectors.linkUriInput)
      .simulate('change', { target: { value: 'https://www.contentful.com' } });

    expect(wrapper.find(selectors.confirmCta)).not.toBeDisabled();
    wrapper.find(selectors.confirmCta).simulate('click');

    expect(mockOnConfirm).toHaveBeenCalledWith({
      type: 'uri',
      text: 'My text link',
      uri: 'https://www.contentful.com',
    });
  });

  it('allows the user to edit an existing hyperlink to a URL', async function () {
    const mockOnConfirm = jest.fn();

    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={(e) => mockOnConfirm(e)}
        onCancel={() => {}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri',
        }}
      />
    );

    expect(wrapper.find(selectors.linkTextInput).props().value).toEqual('My text link');
    expect(wrapper.find(selectors.linkUriInput).props().value).toEqual(
      'https://www.contentful.com'
    );

    wrapper
      .find(selectors.linkTextInput)
      .simulate('change', { target: { value: 'My updated text link' } });
    wrapper
      .find(selectors.linkUriInput)
      .simulate('change', { target: { value: 'https://app.contentful.com' } });
    wrapper.find(selectors.confirmCta).simulate('click');

    expect(mockOnConfirm).toHaveBeenCalledWith({
      type: 'uri',
      text: 'My updated text link',
      uri: 'https://app.contentful.com',
    });
  });

  it('allows the user to cancel editing an existing hyperlink to a URL', async function () {
    const mockOnCancel = jest.fn();

    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={() => {}}
        onCancel={mockOnCancel}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri',
        }}
      />
    );

    expect(wrapper.find(selectors.linkTextInput).props().value).toEqual('My text link');
    expect(wrapper.find(selectors.linkUriInput).props().value).toEqual(
      'https://www.contentful.com'
    );

    wrapper.find(selectors.cancelCta).simulate('click');

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders a "link type" field if passed multiple entity configs', async function () {
    const entitySelectorConfigs = {
      Entry: {},
      Asset: {},
    };

    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={() => {}}
        onCancel={() => {}}
        entitySelectorConfigs={entitySelectorConfigs}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri',
        }}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect)).toExist();
    expect(
      wrapper
        .find(selectors.linkTypeSelectOptions)
        .map((element) => element.text())
        .sort()
    ).toEqual(['Asset', 'Entry', 'URL'].sort());
    expect(wrapper.find(selectors.linkTypeSelectOptions)).toHaveLength(3);
  });

  it('does not render a "link type" field if not passed entity configs', async function () {
    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={() => {}}
        onCancel={() => {}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri',
        }}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect)).not.toExist();
    expect(wrapper.find(selectors.linkTypeSelectOptions)).toHaveLength(0);
  });

  it('does not render "url" option in link type field if not passed url in entity configs', async function () {
    const allowedHyperlinkTypes = ['Asset', 'Entry'];
    const entitySelectorConfigs = {
      Entry: {},
      Asset: {},
    };

    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={() => {}}
        onCancel={() => {}}
        allowedHyperlinkTypes={allowedHyperlinkTypes}
        entitySelectorConfigs={entitySelectorConfigs}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect)).toExist();
    expect(wrapper.find(selectors.linkTypeSelectOptions)).toHaveLength(2);
    expect(
      wrapper
        .find(selectors.linkTypeSelectOptions)
        .map((element) => element.text())
        .sort()
    ).toEqual(['Asset', 'Entry'].sort());
  });

  it('renders entity selector by default if link type is not URL', async function () {
    const allowedHyperlinkTypes = ['Asset', 'Entry'];
    const entitySelectorConfigs = {
      Entry: {},
      Asset: {},
    };

    const wrapper = mount(
      <HyperlinkDialogForm
        onConfirm={() => {}}
        onCancel={() => {}}
        value={{}}
        allowedHyperlinkTypes={allowedHyperlinkTypes}
        entitySelectorConfigs={entitySelectorConfigs}
      />
    );

    expect(wrapper.find(selectors.entitySelector)).toExist();
  });
});
