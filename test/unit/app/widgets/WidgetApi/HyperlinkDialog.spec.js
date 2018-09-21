import sinon from 'npm:sinon';
import React from 'react';
import { mount } from 'enzyme';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('HyperlinkDialog', () => {
  beforeEach(function() {
    const system = createIsolatedSystem();
    this.system = system;

    system.set('AngularComponent', { default: {} });
    system.set('search/EntitySelector/Config.es6', { getLabels: () => {} });

    this.importModule = async function importModule() {
      return (await system.import('app/widgets/WidgetApi/HyperlinkDialog.es6')).default;
    };
  });

  it('renders the hyperlink dialog component', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();
    const mockOnCancel = sinon.spy();
    const mockOnRender = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onRender={mockOnRender}
        entitySelectorConfigs={{}}
      />
    );

    expect(wrapper.find('[data-test-id="create-hyperlink-dialog"]').exists()).toBe(true);
  });

  xit('it allows the user to add a new hyperlink', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();
    const mockOnCancel = sinon.spy();
    const mockOnRender = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={e => mockOnConfirm(e)}
        onCancel={mockOnCancel}
        onRender={mockOnRender}
        entitySelectorConfigs={{}}
      />
    );

    const confirmCta = wrapper.find('button[data-test-id="confirm-cta"]');
    const textInput = wrapper.find('input[data-test-id="link-text-input"]');
    const uriInput = wrapper.find('input[data-test-id="link-uri-input"]');

    expect(confirmCta.prop('disabled')).toBe(true);
    confirmCta.simulate('click');
    expect(mockOnConfirm.called).toBe(false);

    textInput.simulate('change', { target: { value: 'My text link' } });
    uriInput.simulate('change', { target: { value: 'https://www.contentful.com' } });

    expect(wrapper.find('button[data-test-id="confirm-cta"]').prop('disabled')).toBe(false);
    // TODO: This does not trigger form onSubmit. See https://github.com/airbnb/enzyme/issues/308 and avoid `simulate`.
    confirmCta.simulate('click');
    sinon.assert.calledOnceWith(mockOnConfirm, {
      type: 'uri',
      text: 'My text link',
      uri: 'https://www.contentful.com'
    });
  });

  xit('it allows the user to edit an existing hyperlink', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();
    const mockOnCancel = sinon.spy();
    const mockOnRender = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={e => mockOnConfirm(e)}
        onCancel={mockOnCancel}
        onRender={mockOnRender}
        entitySelectorConfigs={{}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    const confirmCta = wrapper.find('button[data-test-id="confirm-cta"]');
    const textInput = wrapper.find('input[data-test-id="link-text-input"]');
    const uriInput = wrapper.find('input[data-test-id="link-uri-input"]');

    expect(textInput.props().value).toEqual('My text link');
    expect(uriInput.props().value).toEqual('https://www.contentful.com');

    textInput.simulate('change', { target: { value: 'My updated text link' } });
    uriInput.simulate('change', { target: { value: 'https://app.contentful.com' } });
    // TODO: See TODO above.
    confirmCta.simulate('click');

    expect(mockOnConfirm.called).toBe(true);
    sinon.assert.calledOnceWith(mockOnConfirm, {
      type: 'uri',
      text: 'My updated text link',
      uri: 'https://app.contentful.com'
    });
  });

  xit('it allows the user to cancel editing an existing hyperlink', async function() {
    const Component = await this.importModule();
    const mockOnConfirm = sinon.spy();
    const mockOnCancel = sinon.spy();
    const mockOnRender = sinon.spy();

    const wrapper = mount(
      <Component
        onConfirm={e => mockOnConfirm(e)}
        onCancel={mockOnCancel}
        onRender={mockOnRender}
        entitySelectorConfigs={{}}
        value={{
          text: 'My text link',
          uri: 'https://www.contentful.com',
          type: 'uri'
        }}
      />
    );

    const cancelCta = wrapper.find('button[data-test-id="cancel-cta"]');
    const textInput = wrapper.find('input[data-test-id="link-text-input"]');
    const uriInput = wrapper.find('input[data-test-id="link-uri-input"]');

    expect(textInput.props().value).toEqual('My text link');
    expect(uriInput.props().value).toEqual('https://www.contentful.com');

    textInput.simulate('change', { target: { value: 'My updated text link' } });
    uriInput.simulate('change', { target: { value: 'https://app.contentful.com' } });
    // TODO: See TODO above.
    cancelCta.simulate('click');

    expect(mockOnCancel.called).toBe(true);
    expect(
      mockOnConfirm.calledWith({
        type: 'uri',
        text: 'My updated text link',
        uri: 'https://app.contentful.com'
      })
    ).toBe(true);
  });
});
