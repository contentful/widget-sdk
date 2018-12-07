import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'test/helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { stubAll, setupWidgetApi, createSandbox, ENTRY } from './setup';
import { document, block, text } from './helpers';

import { BLOCKS } from '@contentful/rich-text-types';

const supportedToolbarIcons = [BLOCKS.UL_LIST, BLOCKS.OL_LIST, BLOCKS.QUOTE];

const getToolbarIcon = (wrapper, iconName) =>
  wrapper.find(`[data-test-id="toolbar-toggle-${iconName}"]`).first();

const expectIsEditorReadOnly = (wrapper, expected) => {
  const el = wrapper.find('[data-test-id="editor"]');
  expect(el.props().readOnly).toBe(expected);
};

describe('RichTextEditor', () => {
  beforeEach(async function() {
    module('contentful/test');
    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));
    this.system = createIsolatedSystem();

    this.entity = ENTRY;

    stubAll({ isolatedSystem: this.system });

    this.system.set('entitySelector', {
      default: {
        openFromField: () => Promise.resolve([this.entity])
      }
    });
    this.system.set('detect-browser', {
      detect: () => ({ name: 'ie' })
    });
    this.system.set('app/widgets/rich_text/withTracking.es6', {
      default: component => component
    });

    const { default: RichTextEditor } = await this.system.import('app/widgets/rich_text/index.es6');

    this.widgetApi = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument);

    this.props = {
      field: this.widgetApi.field,
      onChange: sinon.spy(),
      isDisabled: false,
      widgetAPI: { dialogs: {} }
    };

    this.sandbox = createSandbox(window);
    this.wrapper = mount(<RichTextEditor {...this.props} />, { attachTo: this.sandbox });
  });

  afterEach(function() {
    this.wrapper.unmount();
    this.sandbox.remove();
  });

  it('renders the component', function() {
    expect(this.wrapper).toBeDefined();
  });

  it('can be focused', function() {
    expectIsEditorReadOnly(this.wrapper, false);
  });

  it('renders toolbar', function() {
    const el = this.wrapper.find('[data-test-id="toolbar"]').first();
    expect(el.length).toEqual(1);
  });

  describe('disabled `props.field`', function() {
    beforeEach(async function() {
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      this.wrapper.update();
    });

    it('can not be focused', async function() {
      expectIsEditorReadOnly(this.wrapper, true);
    });

    it('toolbar icons are disabled', function() {
      supportedToolbarIcons.forEach(iconName => {
        const el = getToolbarIcon(this.wrapper, iconName);
        expect(el.props().disabled).toEqual(true);
      });
    });
  });
});
