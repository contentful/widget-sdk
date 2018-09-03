import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { BLOCKS, MARKS } from '@contentful/structured-text-types';

const supportedToolbarIcons = [
  MARKS.BOLD,
  MARKS.ITALIC,
  MARKS.UNDERLINE,
  BLOCKS.UL_LIST,
  BLOCKS.OL_LIST,
  BLOCKS.EMBEDDED_ENTRY
];

const getHeadingDropdown = wrapper =>
  wrapper.find(`[data-test-id="toolbar-heading-toggle"]`).first();

const getToolbarIcon = (wrapper, iconName) =>
  wrapper.find(`[data-test-id="toolbar-toggle-${iconName}"]`).first();

describe('StructuredTextEditor', () => {
  beforeEach(async function() {
    module('contentful/test');
    const mockDocument = {
      content: []
    };
    this.system = createIsolatedSystem();

    this.system.set('ui/cf/thumbnailHelpers', {});
    this.system.set('spaceContext', {
      cma: {
        getEntry: Promise.resolve([this.entity])
      }
    });
    this.system.set('navigation/SlideInNavigator', {
      goToSlideInEntity: sinon.stub()
    });
    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/StructuredTextEditor'
    );

    this.props = {
      value: mockDocument,
      isDisabled: false,
      onChange: sinon.spy(),
      widgetAPI: { dialogs: {} }
    };
    this.wrapper = mount(<StructuredTextEditor {...this.props} />);

    this.expectIsEditorReadOnly = expected => {
      const el = this.wrapper.find('[data-test-id="editor"]');
      expect(el.props().readOnly).toBe(expected);
    };
  });

  it('renders the component', function() {
    expect(this.wrapper).toBeDefined();
  });

  it('can be focused', function() {
    this.expectIsEditorReadOnly(false);
  });

  it('renders toolbar', function() {
    const el = this.wrapper.find('[data-test-id="toolbar"]').first();
    expect(el.length).toEqual(1);
  });

  it('renders the toolbar icons', function() {
    supportedToolbarIcons.forEach(iconName => {
      const el = getToolbarIcon(this.wrapper, iconName);

      expect(el.length).toEqual(1);

      el.simulate('click');
      sinon.assert.calledOnce(this.wrapper.props().onChange);
    });
  });

  it('renders heading dropdown', function() {
    const headingItems = [BLOCKS.HEADING_1, BLOCKS.HEADING_2];

    const el = getHeadingDropdown(this.wrapper);
    el.simulate('mouseDown');

    headingItems.forEach(iconName => {
      const el = getToolbarIcon(this.wrapper, iconName);
      expect(el.length).toEqual(1);
      el.simulate('click');
      sinon.assert.calledOnce(this.wrapper.props().onChange);
    });
  });

  it('renders the embed entry button', function() {
    const el = getToolbarIcon(this.wrapper, BLOCKS.EMBEDDED_ENTRY);
    expect(el).toBeDefined();
    el.simulate('click');
    sinon.assert.calledOnce(this.wrapper.props().onChange);
  });

  describe('disabled `props.field`', function() {
    beforeEach(function() {
      this.wrapper.setProps({ isDisabled: true });
    });

    it('can not be focused', function() {
      this.expectIsEditorReadOnly(true);
    });

    it('toolbar icons are disabled', function() {
      supportedToolbarIcons.forEach(iconName => {
        const el = getToolbarIcon(this.wrapper, iconName);
        expect(el.props().disabled).toEqual(true);
      });
      const dropdown = getHeadingDropdown(this.wrapper);

      expect(dropdown.props().disabled).toEqual(true);
    });
  });
});
