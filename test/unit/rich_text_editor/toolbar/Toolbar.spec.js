import React from 'react';
import Enzyme from 'enzyme';
import { parseHotkey } from 'is-hotkey';
import { mapValues, forEach, upperFirst } from 'lodash';

import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { actionOrigin } from 'app/widgets/rich_text/plugins/shared/PluginApi.es6';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, inline, text, getWithId } from '../helpers';
import { stubAll, setupWidgetApi, createSandbox, ENTRY } from '../setup';
import flushPromises from '../../../helpers/flushPromises';

const triggerToolbarIcon = async (wrapper, iconName) => {
  await flushPromises();
  const toolbarIcon = getWithId(wrapper, `toolbar-toggle-${iconName}`);
  // TODO: EMBED_ASSET case only works with `click`.
  toolbarIcon
    .find('button')
    .simulate('mouseDown')
    .simulate('click');
};

const triggerDropdownButton = async (wrapper, dataTestId) => {
  await flushPromises();
  const toolbarIcon = getWithId(wrapper, dataTestId);
  toolbarIcon.find('button').simulate('mouseDown');
};

const EMPTY_PARAGRAPH = block(BLOCKS.PARAGRAPH, {}, text());

export const ASSET = {
  sys: {
    type: 'Asset',
    id: 'ASSET-TEST-ID'
  }
};

describe('Toolbar', () => {
  beforeEach(async function() {
    module('contentful/test');

    const ServicesProvider = this.$inject('ServicesProvider');

    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));

    this.system = createIsolatedSystem();
    this.selectedEntity = null;

    // TODO: Stub `buildWidgetApi.es6` instead.
    this.system.set('entitySelector', {
      default: {
        open: () => Promise.resolve([this.selectedEntity])
      }
    });
    this.openHyperlinkDialog = sinon.stub();

    stubAll({ isolatedSystem: this.system });

    this.system.set('app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6', {
      default: this.openHyperlinkDialog
    });
    this.system.set('analytics/Analytics.es6', {
      track: sinon.stub()
    });
    this.system.set('logger', {
      default: {
        logWarn: message => {
          // Guards us from accidentally changing analytic actions without whitelisting them:
          throw new Error(`Unexpected logger.logWarn() call with message: ${message}`);
        }
      }
    });

    // TODO: Test RichTextEditor without any HOCs here and test HOC separately.
    const { default: RichTextEditor } = await this.system.import('app/widgets/rich_text/index.es6');

    this.field = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument).field;

    this.props = {
      field: this.field,
      entry: {
        getSys: sinon.stub().returns({
          id: 'ENTRY_ID',
          contentType: { sys: { id: 'CT_Id' } }
        })
      },
      onChange: sinon.spy(),
      onAction: sinon.spy(),
      features: { embedInlineEntry: true }
    };
    this.sandbox = createSandbox(window);

    this.mount = (props = this.props) => {
      this.wrapper = Enzyme.mount(
        <ServicesProvider>
          <RichTextEditor {...props} />
        </ServicesProvider>,
        { attachTo: this.sandbox }
      );
    };

    const embedEntity = async (entity, nodeType) => {
      this.selectedEntity = entity;
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      await triggerToolbarIcon(this.wrapper, nodeType);
    };

    this.editorApi = {};
    this.editorApi.focus = () => this.editorNode.getDOMNode().click();
    this.editorApi.clickIcon = async type => await triggerToolbarIcon(this.wrapper, type);
    this.editorApi.embedEntryBlock = entry => embedEntity(entry, BLOCKS.EMBEDDED_ENTRY);
    this.editorApi.embedInlineEntry = entry => embedEntity(entry, INLINES.EMBEDDED_ENTRY);
    this.editorApi.embedAssetBlock = asset => embedEntity(asset, BLOCKS.EMBEDDED_ASSET);
    this.editorApi.typeText = text => this.editorNode.simulate('beforeinput', { data: text });
    this.editorApi.pressKeys = async keys => {
      await flushPromises();
      const event = {
        ...parseHotkey(keys, { byKey: true }),
        ...parseHotkey(keys)
      };

      event.key = upperFirst(event.key);

      this.editorNode.simulate('keyDown', event);
    };
    this.editorApi.pressEnter = this.editorApi.pressKeys.bind(null, 'enter');
    this.editorApi.pressTab = this.editorApi.pressKeys.bind(null, 'tab');
    this.editorApi.pressBackspace = this.editorApi.pressKeys.bind(null, 'backspace');

    this.setup = () => {
      this.mount();
      this.editorNode = getWithId(this.wrapper, 'editor');
      let editorApi = {};
      const promises = [];
      const chainableApiFn = fn => (...args) => {
        let lastPromise = promises[promises.length - 1] || Promise.resolve();
        lastPromise = lastPromise.then(() => {
          return fn(...args);
        });
        promises.push(lastPromise);
        return Object.assign(Promise.all(promises), editorApi);
      };
      editorApi = mapValues(this.editorApi, fn => chainableApiFn(fn));
      return { editor: editorApi };
    };
  });

  afterEach(function() {
    this.wrapper.unmount();
    this.wrapper = null;
    this.sandbox.remove();
  });

  describe('Hyperlink', () => {
    forEach(
      {
        [INLINES.HYPERLINK]: {
          type: 'uri',
          uri: 'https://foo.bar'
        },
        [INLINES.ASSET_HYPERLINK]: {
          type: 'Asset',
          target: {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'ASSET-ID'
            }
          }
        },
        [INLINES.ENTRY_HYPERLINK]: {
          type: 'Entry',
          target: {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'ASSET-ID'
            }
          }
        }
      },
      testHyperlink
    );
  });

  function testHyperlink(dialogData, nodeType) {
    it(`supports "${nodeType}" type hyperlink `, async function({ editor }) {
      this.openHyperlinkDialog.returns(Promise.resolve({ text: 'a hyperlink', ...dialogData }));
      const { target, uri } = dialogData;
      const expectedLinkData = target ? { target } : { uri };

      await editor.clickIcon(INLINES.HYPERLINK);
      await flushPromises();

      expect(this.field.getValue()).toEqual(
        document(
          block(
            BLOCKS.PARAGRAPH,
            {},
            text(),
            inline(nodeType, expectedLinkData, text('a hyperlink')),
            text()
          )
        )
      );
    });

    it('logs opening the dialog', async function({ editor }) {
      this.openHyperlinkDialog.returns(new Promise(() => {}));

      await editor.clickIcon(INLINES.HYPERLINK);

      sinon.assert.calledOnceWith(this.props.onAction, 'openCreateHyperlinkDialog', {
        origin: 'toolbar-icon'
      });
    });

    it('logs dialog cancellation', async function({ editor }) {
      this.openHyperlinkDialog.returns(Promise.reject());

      await editor.clickIcon(INLINES.HYPERLINK);

      sinon.assert.calledWith(this.props.onAction, 'cancelCreateHyperlinkDialog', {
        origin: 'toolbar-icon'
      });
    });

    it('logs `insert` action on dialog confirmation', async function({ editor }) {
      this.openHyperlinkDialog.returns(Promise.resolve({ text: 'a hyperlink', ...dialogData }));

      await editor.clickIcon(INLINES.HYPERLINK);

      sinon.assert.calledWith(this.props.onAction, 'insert', {
        origin: 'toolbar-icon',
        linkType: dialogData.type,
        nodeType
      });
    });
  }

  describe('Embed Dropdown', () => {
    it('renders the embed dropdown', async function() {
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      expect(getWithId(this.wrapper, 'cf-ui-dropdown-list').getDOMNode()).toBeDefined();
    });

    it('inserts the embed block button', async function() {
      this.props.field.validations = [{ enabledNodeTypes: ['embedded-entry-block'] }];
      this.mount({ ...this.props, features: { embedInlineEntry: false } });
      expect(
        getWithId(this.wrapper, `toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`).getDOMNode()
      ).toBeDefined();
      this.props.field.validations = undefined;
    });
  });

  describe('EmbeddedEntryBlock', () => {
    it('inserts block', async function({ editor }) {
      await editor.embedEntryBlock(ENTRY);

      expect(this.field.getValue()).toEqual(
        document(newEmbeddedEntityBlock(ENTRY), EMPTY_PARAGRAPH)
      );
    });
  });

  describe('EmbeddedAssetBlock', () => {
    it('inserts block', async function({ editor }) {
      await editor.embedAssetBlock(ASSET);

      expect(this.field.getValue()).toEqual(
        document(newEmbeddedEntityBlock(ASSET), EMPTY_PARAGRAPH)
      );
    });
  });

  describe('EmbeddedEntryInline', () => {
    it('inserts inline entry', async function({ editor }) {
      await editor.embedInlineEntry(ENTRY);

      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text(), newEmbeddedEntryInline(ENTRY), text()))
      );
    });
  });

  describe('List', () => {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function(listType) {
      it(`inserts ${listType}`, async function({ editor }) {
        await editor.clickIcon(listType);

        expect(this.field.getValue()).toEqual(
          document(
            block(listType, {}, block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH)),
            EMPTY_PARAGRAPH
          )
        );
      });

      it(`removes empty ${listType} after second click`, async function({ editor }) {
        await editor.clickIcon(listType).clickIcon(listType);

        expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
      });

      it('inserts text into list-item', async function({ editor }) {
        await editor
          .clickIcon(listType)
          .typeText('a')
          .typeText('b')
          .pressEnter();

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text('ab'))),
              block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH)
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts nested list-item when tab is pressed', async function({ editor }) {
        await editor
          .clickIcon(listType)
          .typeText('a')
          .pressEnter()
          .pressTab();

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text('a')),
                block(listType, {}, block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH))
              )
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts an embedded entry into list-item', async function({ editor }) {
        await editor.clickIcon(listType).embedEntryBlock(ENTRY);

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(BLOCKS.LIST_ITEM, {}, newEmbeddedEntityBlock(ENTRY), EMPTY_PARAGRAPH)
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts an inline entry into list-item', async function({ editor }) {
        await editor.clickIcon(listType).embedInlineEntry(ENTRY);

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text(), newEmbeddedEntryInline(ENTRY), text())
              )
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      // TODO: Why is this test disabled?
      xit("doesn't duplicate inline entry on the next line", async function({ editor }) {
        await editor
          .focus()
          .clickIcon(listType)
          .embedInlineEntry(ENTRY);

        getWithId(this.wrapper, INLINES.EMBEDDED_ENTRY).simulate('click');

        await editor.pressEnter();

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text(), newEmbeddedEntryInline(ENTRY), text())
              ),
              block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH)
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts quote inside a list-item', async function({ editor }) {
        await editor.clickIcon(listType).clickIcon(BLOCKS.QUOTE);

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.QUOTE, {}, EMPTY_PARAGRAPH))
            ),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts a mark inside a list-item', async function({ editor }) {
        await editor
          .clickIcon(listType)
          .clickIcon(MARKS.CODE)
          .typeText('golang');

        expect(this.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text('golang', [{ type: MARKS.CODE }]))
              )
            ),
            EMPTY_PARAGRAPH
          )
        );
      });
    });
  });

  describe('Quote', () => {
    const configs = [
      {
        forToolbarIcon: BLOCKS.QUOTE,
        forShortcut: 'ctrl+shift+1'
      },

      {
        forToolbarIcon: BLOCKS.QUOTE,
        forShortcut: 'cmd+shift+1'
      }
    ];

    configs.forEach(config => {
      describeAction(`insert quote`, config, ({ actionOrigin }) => {
        beforeEach(async function() {
          await this.setup()
            .editor.triggerAction()
            .typeText('a quote');
        });

        itUpdatesFieldValue(
          document(
            block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text('a quote'))),
            EMPTY_PARAGRAPH
          )
        );

        itLogsAction('insert', {
          origin: actionOrigin,
          nodeType: BLOCKS.QUOTE
        });
      });

      describeAction(`remove quote`, config, ({ actionOrigin }) => {
        beforeEach(async function() {
          const { editor } = this.setup();
          await editor.triggerAction();

          this.props.onAction.resetHistory();

          await editor.triggerAction();
        });

        itUpdatesFieldValue(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));

        itLogsAction('remove', {
          origin: actionOrigin,
          nodeType: BLOCKS.QUOTE
        });
      });
    });

    it(`removes quote on Backspace`, async function({ editor }) {
      await editor.clickIcon(BLOCKS.QUOTE).pressBackspace();

      expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH));
    });
  });

  describe('Marks', () => {
    [
      { mark: MARKS.BOLD, shortcut: 'ctrl+b' },
      { mark: MARKS.BOLD, shortcut: 'cmd+b' },
      { mark: MARKS.CODE, shortcut: 'ctrl+/' },
      { mark: MARKS.CODE, shortcut: 'cmd+/' },
      { mark: MARKS.ITALIC, shortcut: 'ctrl+i' },
      { mark: MARKS.ITALIC, shortcut: 'cmd+i' },
      { mark: MARKS.UNDERLINE, shortcut: 'ctrl+u' },
      { mark: MARKS.UNDERLINE, shortcut: 'cmd+u' }
    ].forEach(testMark);
  });

  function testMark({ mark, shortcut }) {
    const config = {
      forToolbarIcon: mark,
      forShortcut: shortcut
    };

    describeAction(`mark as ${mark}`, config, ({ actionOrigin }) => {
      beforeEach(async function() {
        await this.setup()
          .editor.triggerAction()
          .typeText('a text');
      });

      itUpdatesFieldValue(document(block(BLOCKS.PARAGRAPH, {}, text('a text', [{ type: mark }]))));

      itLogsAction('mark', {
        origin: actionOrigin,
        markType: mark
      });
    });

    describeAction(`unmark ${mark}`, config, ({ actionOrigin }) => {
      beforeEach(async function() {
        const { editor } = this.setup();
        await editor.triggerAction();

        this.props.onAction.resetHistory();

        await editor.triggerAction().typeText('a text');
      });

      itUpdatesFieldValue(document(block(BLOCKS.PARAGRAPH, {}, text('a text', []))));

      itLogsAction('unmark', {
        origin: actionOrigin,
        markType: mark
      });
    });
  }

  describe('HR', () => {
    it('inserts the HR', async function({ editor }) {
      await editor.clickIcon(BLOCKS.HR);
      expect(this.field.getValue()).toEqual(document(block(BLOCKS.HR, {}), EMPTY_PARAGRAPH));
    });
  });

  describe('headings', () => {
    const headings = [
      BLOCKS.HEADING_1,
      BLOCKS.HEADING_2,
      BLOCKS.HEADING_3,
      BLOCKS.HEADING_4,
      BLOCKS.HEADING_5,
      BLOCKS.HEADING_6
    ];

    headings.forEach(function(heading, index) {
      it(`inserts ${heading}`, async function({ editor }) {
        const dropdown = getWithId(this.wrapper, 'toolbar-heading-toggle');
        dropdown.simulate('mousedown');
        getWithId(this.wrapper, `heading-${index + 1}`)
          .find('[data-test-id="cf-ui-dropdown-list-item-button"]')
          .first()
          .simulate('mousedown');
        await flushPromises();
        await editor.typeText('a');

        expect(this.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });
    });

    const headingShortcuts = [
      { heading: BLOCKS.HEADING_1, shortcut: 'ctrl+opt+1' },
      { heading: BLOCKS.HEADING_1, shortcut: 'cmd+opt+1' },
      { heading: BLOCKS.HEADING_2, shortcut: 'ctrl+opt+2' },
      { heading: BLOCKS.HEADING_2, shortcut: 'cmd+opt+2' },
      { heading: BLOCKS.HEADING_3, shortcut: 'ctrl+opt+3' },
      { heading: BLOCKS.HEADING_3, shortcut: 'cmd+opt+3' },
      { heading: BLOCKS.HEADING_4, shortcut: 'ctrl+opt+4' },
      { heading: BLOCKS.HEADING_4, shortcut: 'cmd+opt+4' },
      { heading: BLOCKS.HEADING_5, shortcut: 'ctrl+opt+5' },
      { heading: BLOCKS.HEADING_5, shortcut: 'cmd+opt+5' },
      { heading: BLOCKS.HEADING_6, shortcut: 'ctrl+opt+6' },
      { heading: BLOCKS.HEADING_6, shortcut: 'cmd+opt+6' }
    ];

    headingShortcuts.forEach(function({ heading, shortcut }) {
      it(`inserts ${heading} with ${shortcut}`, async function({ editor }) {
        await editor.pressKeys(shortcut).typeText('a');

        expect(this.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });
    });
  });
});

function newEmbeddedEntityBlock(entity) {
  const { id, type: linkType } = entity.sys;
  const data = {
    target: {
      sys: { id, type: 'Link', linkType }
    }
  };
  const entityBlockName = 'EMBEDDED_' + linkType.toUpperCase();
  return block(BLOCKS[entityBlockName], data);
}

function newEmbeddedEntryInline(entity) {
  const { id } = entity.sys;
  const data = {
    target: {
      sys: { id, type: 'Link', linkType: 'Entry' }
    }
  };
  return inline(INLINES.EMBEDDED_ENTRY, data);
}

function describeAction(description, { forShortcut, forToolbarIcon }, setupTests) {
  describe(`${description} via toolbar icon`, () => {
    beforeEach(function() {
      this.editorApi.triggerAction = () => this.editorApi.clickIcon(forToolbarIcon);
    });
    setupTests({ actionOrigin: actionOrigin.TOOLBAR });
  });

  describe(`${description} via shortcut ${forShortcut}`, () => {
    beforeEach(function() {
      this.editorApi.triggerAction = () => this.editorApi.pressKeys(forShortcut);
    });
    setupTests({ actionOrigin: actionOrigin.SHORTCUT });
  });
}

function itUpdatesFieldValue(expectedValue) {
  it('updates field value', function() {
    expect(this.field.getValue()).toEqual(expectedValue);
  });
}

function itLogsAction(action, data) {
  it('invokes `props.onAction`', function() {
    sinon.assert.calledOnceWith(this.props.onAction, action, data);
  });
}
