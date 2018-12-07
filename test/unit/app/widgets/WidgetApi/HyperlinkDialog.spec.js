import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('HyperlinkDialog', () => {
  const selectors = {
    hyperlinkDialog: '[data-test-id="create-hyperlink-dialog"]',
    confirmCta: 'button[data-test-id="confirm-cta"]',
    cancelCta: 'button[data-test-id="cancel-cta"]',
    linkTextInput: 'input[data-test-id="link-text-input"]',
    linkUriInput: 'input[data-test-id="link-uri-input"]',
    linkTypeSelect: 'select[data-test-id="link-type-select"]',
    linkTypeSelectOptions: 'select[data-test-id="link-type-select"] option',
    entitySelector: '[data-test-id="entity-selector-container"]',
    fetchedEntityCard: '[data-test-id="cf-ui-reference-card"]'
  };

  beforeEach(function() {
    const system = createIsolatedSystem();

    system.set('search/EntitySelector/Config.es6', {
      getLabels: () => ({
        title: '',
        input: '',
        info: '',
        empty: '',
        searchPlaceholder: ''
      }),
      calculateIdealListHeight: () => 200
    });

    system.set('AngularComponent', {
      default: () => <div />
    });

    this.importModule = async function importModule() {
      return (await system.import('app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6')).default;
    };
  });

  it('renders the hyperlink dialog component', async function() {
    const Component = await this.importModule();

    const wrapper = mount(<Component onConfirm={() => {}} onCancel={() => {}} />);

    expect(wrapper.find(selectors.hyperlinkDialog).exists()).toBe(true);
  });

  it('allows the user to add a hyperlink to a URL', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();

    const wrapper = mount(<Component onConfirm={e => mockOnConfirm(e)} onCancel={() => {}} />);

    expect(wrapper.find(selectors.confirmCta).prop('disabled')).toBe(true);
    wrapper.find(selectors.confirmCta).simulate('click');
    sinon.assert.notCalled(mockOnConfirm);

    wrapper.find(selectors.linkTextInput).simulate('change', { target: { value: 'My text link' } });
    wrapper
      .find(selectors.linkUriInput)
      .simulate('change', { target: { value: 'https://www.contentful.com' } });

    expect(wrapper.find(selectors.confirmCta).prop('disabled')).toBe(false);
    // TODO: Using 'click' does not trigger form onSubmit. See https://github.com/airbnb/enzyme/issues/308
    wrapper.find(selectors.confirmCta).simulate('submit');

    sinon.assert.calledWith(mockOnConfirm, {
      type: 'uri',
      text: 'My text link',
      uri: 'https://www.contentful.com'
    });
  });

  it('allows the user to edit an existing hyperlink to a URL', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={e => mockOnConfirm(e)}
        onCancel={() => {}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
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
    // TODO: Using 'click' does not trigger form onSubmit. See https://github.com/airbnb/enzyme/issues/308
    wrapper.find(selectors.confirmCta).simulate('submit');

    sinon.assert.calledWith(mockOnConfirm, {
      type: 'uri',
      text: 'My updated text link',
      uri: 'https://app.contentful.com'
    });
  });

  it('allows the user to cancel editing an existing hyperlink to a URL', async function() {
    const Component = await this.importModule();
    const mockOnCancel = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={() => {}}
        onCancel={mockOnCancel}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    expect(wrapper.find(selectors.linkTextInput).props().value).toEqual('My text link');
    expect(wrapper.find(selectors.linkUriInput).props().value).toEqual(
      'https://www.contentful.com'
    );

    wrapper.find(selectors.cancelCta).simulate('click');
    sinon.assert.called(mockOnCancel);
  });

  it('renders a "link type" field if passed multiple entity configs', async function() {
    const Component = await this.importModule();

    const entitySelectorConfigs = {
      Entry: {},
      Asset: {}
    };

    const wrapper = mount(
      <Component
        onConfirm={() => {}}
        onCancel={() => {}}
        entitySelectorConfigs={entitySelectorConfigs}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect).exists()).toBe(true);
    expect(
      wrapper
        .find(selectors.linkTypeSelectOptions)
        .map(element => element.text())
        .sort()
    ).toEqual(['Asset', 'Entry', 'URL'].sort());
    expect(wrapper.find(selectors.linkTypeSelectOptions).length).toEqual(3);
  });

  it('does not render a "link type" field if not passed entity configs', async function() {
    const Component = await this.importModule();

    const wrapper = mount(
      <Component
        onConfirm={() => {}}
        onCancel={() => {}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect).exists()).toBe(false);
    expect(wrapper.find(selectors.linkTypeSelectOptions).length).toEqual(0);
  });

  it('does not render "url" option in link type field if not passed url in entity configs', async function() {
    const Component = await this.importModule();
    const allowedHyperlinkTypes = ['Asset', 'Entry'];
    const entitySelectorConfigs = {
      Entry: {},
      Asset: {}
    };

    const wrapper = mount(
      <Component
        onConfirm={() => {}}
        onCancel={() => {}}
        allowedHyperlinkTypes={allowedHyperlinkTypes}
        entitySelectorConfigs={entitySelectorConfigs}
      />
    );

    expect(wrapper.find(selectors.linkTypeSelect).exists()).toBe(true);
    expect(wrapper.find(selectors.linkTypeSelectOptions).length).toEqual(2);
    expect(
      wrapper
        .find(selectors.linkTypeSelectOptions)
        .map(element => element.text())
        .sort()
    ).toEqual(['Asset', 'Entry'].sort());
  });

  it('renders entity selector by default if link type is not URL', async function() {
    const Component = await this.importModule();
    const allowedHyperlinkTypes = ['Asset', 'Entry'];
    const entitySelectorConfigs = {
      Entry: {},
      Asset: {}
    };

    const wrapper = mount(
      <Component
        onConfirm={() => {}}
        onCancel={() => {}}
        value={{}}
        allowedHyperlinkTypes={allowedHyperlinkTypes}
        entitySelectorConfigs={entitySelectorConfigs}
      />
    );

    expect(wrapper.find(selectors.entitySelector).exists()).toBe(true);
  });

  it('calls an onRender function', async function() {
    const Component = await this.importModule();
    const mockOnRender = sinon.spy();

    mount(
      <Component
        onConfirm={() => {}}
        onCancel={() => {}}
        onRender={e => mockOnRender(e)}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    sinon.assert.called(mockOnRender);
  });
});
