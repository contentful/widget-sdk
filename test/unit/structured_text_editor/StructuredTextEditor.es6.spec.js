import React from 'react';
import { mount } from 'enzyme';

import { createIsolatedSystem } from 'test/helpers/system-js';
import { BLOCKS, MARKS } from '@contentful/structured-text-types';

describe('StructuredTextEditor', () => {
  beforeEach(async function () {
    module('contentful/test');
    this.system = createIsolatedSystem();

    this.system.set('entitySelector', {});
    this.system.set('ui/cf/thumbnailHelpers', {});
    this.system.set('spaceContext', {
      cma: {
        getEntry: sinon.stub.resolves()
      }
    });
    this.system.set('states/EntityNavigationHelpers', {
      goToSlideInEntity: sinon.stub()
    });
    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/StructuredTextEditor'
    );

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.props = {
      field: this.widgetApi.field
    };
    this.wrapper = mount(<StructuredTextEditor {...this.props} />);

    this.expectIsEditorReadOnly = (expected) => {
      const el = this.wrapper.find('[data-test-id="editor"]');
      expect(el.props().readOnly).toBe(expected);
    };
  });

  it('renders the component', function () {
    expect(this.wrapper).toBeDefined();
  });

  it('can be focused', function () {
    this.expectIsEditorReadOnly(false);
  });

  it('renders toolbar', function () {
    const el = this.wrapper.first('[data-test-id="toolbar"]');
    expect(el.length).toEqual(1);
  });

  it('renders the toolbar icons', function () {
    const toolbarItems = [
      MARKS.BOLD,
      MARKS.ITALIC,
      MARKS.UNDERLINE
    ];
    toolbarItems.forEach(item => {
      const el = this.wrapper.first(`[data-test-id="toolbar-toggle-${item}"]`);
      expect(el.length).toEqual(1);
      el.simulate('click');
      sinon.assert.calledOnce(this.props.field.setValue);
    });
  });

  it('renders heading dropdown', function () {
    const headingItems = [
      BLOCKS.HEADING_1,
      BLOCKS.HEADING_2
    ];

    const el = this.wrapper.first(`[data-test-id="toolbar-heading-toggle"]`);
    expect(el).toBeDefined();
    el.simulate('click');

    headingItems.forEach(item => {
      const el = this.wrapper.first(`[data-test-id="toolbar-toggle-${item}"]`);
      expect(el.length).toEqual(1);
      el.simulate('click');
      sinon.assert.calledOnce(this.props.field.setValue);
    });
  });

  it('renders the embed entry button', function () {
    const el = this.wrapper.first(`[data-test-id="toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}"]`);
    expect(el).toBeDefined();
    el.simulate('click');
    sinon.assert.calledOnce(this.props.field.setValue);
  });

  describe('disabled `props.field`', function () {
    beforeEach(function () {
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      this.wrapper.update();
    });

    it('can not be focused', function () {
      this.expectIsEditorReadOnly(true);
    });

    it('renders no toolbar', function () {
      const el = this.wrapper.find('[data-test-id="toolbar"]');
      expect(el.length).toEqual(0);
    });
  });
});
