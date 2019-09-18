import React from 'react';
import Enzyme from 'enzyme';
import { parseHotkey } from 'is-hotkey';
import { mapValues, forEach, upperFirst, identity } from 'lodash';

import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { actionOrigin } from 'app/widgets/rich_text/plugins/shared/PluginApi.es6';
import { document, block, inline, text } from 'app/widgets/rich_text/helpers/nodeFactory.es6';

import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

import flushPromises from 'test/utils/flushPromises';

export const ENTRY = {
  sys: {
    type: 'Entry',
    id: 'testid2',
    contentType: {
      sys: {
        id: 'ct-id'
      }
    }
  }
};

const getWithId = (wrapper, testId) => wrapper.find(`[data-test-id="${testId}"]`).first();

const stubAll = async ({ isolatedSystem }) => {
  // TODO: Instead of stubbing all kind of services, stub `buildWidgetApi.es6`!
  isolatedSystem.set('directives/thumbnailHelpers.es6', {});
  isolatedSystem.set('search/EntitySelector/Config.es6', {
    newConfigFromRichTextField: sinon.stub().returns({})
  });
  isolatedSystem.set('app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6', {
    LINK_TYPES: {}
  });
  isolatedSystem.set('utils/LaunchDarkly/index.es6', {
    onFeatureFlag: sinon.stub(),
    getCurrentVariation: sinon.stub()
  });
  isolatedSystem.set('detect-browser', {
    detect: () => ({ name: 'chrome' })
  });

  isolatedSystem.set('access_control/AccessChecker/index.es6', {
    getSectionVisibility: sinon.stub().returns({
      asset: true,
      entry: true
    })
  });

  isolatedSystem.set('analytics/Analytics.es6', {
    track: sinon.stub()
  });
};

const setupWidgetApi = (mockApi, mockDocument) => {
  const widgetApi = mockApi.create();
  widgetApi.fieldProperties.isDisabled$.set(false);
  widgetApi.fieldProperties.value$.set(mockDocument);

  return widgetApi;
};

const createSandbox = window => {
  const el = window.document.createElement('div');
  el.className = 'sticky-parent';
  window.document.body.appendChild(el);
  return el;
};

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

/**
 * These tests rely on Content Editable to interact with the RichTextEditor
 * which is not supported in jsdom yet (see: https://github.com/jsdom/jsdom/issues/1670).
 * Therefore these tests cannot be written in Jest or test actions involving DOM interactions.
 */
describe('Rich Text toolbar', () => {
  beforeEach(async function() {
    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));

    this.selectedEntity = null;

    this.openHyperlinkDialog = sinon.stub();

    stubAll({
      isolatedSystem: this.system
    });

    this.system.set('services/logger.es6', {
      logWarn: message => {
        // Guards us from accidentally changing analytic actions without whitelisting them:
        throw new Error(`Unexpected logger.logWarn() call with message: ${message}`);
      }
    });

    this.system.set('lodash/debounce', {
      default: identity
    });

    this.system.set('app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6', {
      default: this.openHyperlinkDialog
    });
    this.system.set('analytics/Analytics.es6', {
      track: sinon.stub()
    });

    const { default: RichTextEditor } = await this.system.import('app/widgets/rich_text/index.es6');

    await $initialize(this.system, $provide => {
      $provide.constant('EntityHelpers', {
        newForLocale: sinon.stub()
      });

      $provide.constant('entitySelector', {
        open: () => Promise.resolve([this.selectedEntity])
      });

      $provide.constant('spaceContext', {
        cma: {
          getEntries: sinon.stub().returns(Promise.resolve({})),
          getAssets: sinon.stub().returns(Promise.resolve({}))
        }
      });

      $provide.constant('modalDialog', { open: sinon.stub() });
      $provide.constant('$location', { absUrl: () => 'abs-url' });
      $provide.constant('$state', {
        href: sinon.stub()
      });
    });

    const fieldApi = setupWidgetApi($inject('mocks/widgetApi'), mockDocument);
    this.field = fieldApi.field;

    this.props = {
      widgetApi: fieldApi,
      entry: {
        getSys: sinon.stub().returns({
          id: 'ENTRY_ID',
          contentType: { sys: { id: 'CT_Id' } }
        })
      },
      onChange: sinon.spy(),
      onAction: sinon.spy(),
      permissions: {
        canAccessAssets: true
      }
    };
    this.sandbox = createSandbox(window);

    this.mount = (props = this.props) => {
      this.wrapper = Enzyme.mount(<RichTextEditor {...props} />, { attachTo: this.sandbox });

      // HACK: since Enzyme doesn't rerender component after ref resolution
      // (see 'this.editor' in RichTextField). We manually reset isDisabled property
      // to force update the component
      fieldApi.fieldProperties.isDisabled$.set(true);
      fieldApi.fieldProperties.isDisabled$.set(false);
      this.wrapper.update();
    };

    const embedEntity = async (entity, nodeType) => {
      this.selectedEntity = entity;
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      await triggerToolbarIcon(this.wrapper, nodeType);
    };

    this.editorApi = {};
    this.editorApi.focus = () => this.editorNode.getDOMNode().click();
    this.editorApi.clickIcon = type => triggerToolbarIcon(this.wrapper, type);
    this.editorApi.embedEntryBlock = entry => embedEntity(entry, BLOCKS.EMBEDDED_ENTRY);
    this.editorApi.embedInlineEntry = entry => embedEntity(entry, INLINES.EMBEDDED_ENTRY);
    this.editorApi.embedAssetBlock = asset => embedEntity(asset, BLOCKS.EMBEDDED_ASSET);
    this.editorApi.typeText = text =>
      // The editor node is a fragment/array which renders editor and command
      // palette. This is why we need to simulate the events on the first child which is
      // the actual content editable.
      this.editorNode.childAt(0).simulate('beforeinput', { data: text });
    this.editorApi.pressKeys = async keys => {
      await flushPromises();
      const event = {
        ...parseHotkey(keys, { byKey: true }),
        ...parseHotkey(keys)
      };

      event.key = upperFirst(event.key);

      this.editorNode.childAt(0).simulate('keyDown', event);
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

  describe('Hyperlinks', () => {
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
      // await flushPromises();
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
    it('renders the embed dropdown menu when "Embed" toolbar button is selected', async function() {
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      expect(getWithId(this.wrapper, 'cf-ui-dropdown-list').getDOMNode()).toBeDefined();
    });

    it('renders embed dropdown menu items for enabled node types', async function() {
      this.field.validations = [{ enabledNodeTypes: ['embedded-entry-block'] }];
      this.mount({ ...this.props });
      expect(
        getWithId(this.wrapper, `toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`).getDOMNode()
      ).toBeDefined();
    });

    it('inserts an embedded entry when "Embed" > "Entry" option is selected', async function({
      editor
    }) {
      await editor.embedEntryBlock(ENTRY);

      expect(this.field.getValue()).toEqual(
        document(newEmbeddedEntityBlock(ENTRY), EMPTY_PARAGRAPH)
      );
    });

    it('inserts an inline entry when "Embed" > "Inline entry" option is selected', async function({
      editor
    }) {
      await editor.embedInlineEntry(ENTRY);

      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text(), newEmbeddedEntryInline(ENTRY), text()))
      );
    });
  });

  describe('Lists', () => {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function(listType) {
      it(`inserts ${listType} when ${listType} option is selected`, async function({ editor }) {
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

      it('inserts quote block inside a list-item', async function({ editor }) {
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
    const configs = [[BLOCKS.QUOTE, 'mod+shift+1']];

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
      [MARKS.BOLD, 'mod+b'],
      [MARKS.CODE, 'mod+/'],
      [MARKS.ITALIC, 'mod+i'],
      [MARKS.UNDERLINE, 'mod+u']
    ].forEach(testMark);
  });

  function testMark([mark, shortcut]) {
    describeAction(`mark as ${mark}`, [mark, shortcut], ({ actionOrigin }) => {
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

    describeAction(`unmark ${mark}`, [mark, shortcut], ({ actionOrigin }) => {
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

        expect(this.field.getValue()).toEqual(
          document(block(heading, {}, text('a')), EMPTY_PARAGRAPH)
        );
      });
    });

    const headingShortcuts = [
      [BLOCKS.HEADING_1, 'mod+opt+1'],
      [BLOCKS.HEADING_2, 'mod+opt+2'],
      [BLOCKS.HEADING_3, 'mod+opt+3'],
      [BLOCKS.HEADING_4, 'mod+opt+4'],
      [BLOCKS.HEADING_5, 'mod+opt+5'],
      [BLOCKS.HEADING_6, 'mod+opt+6']
    ];

    headingShortcuts.forEach(function([heading, shortcut]) {
      it(`inserts ${heading} with ${shortcut}`, async function({ editor }) {
        await editor.pressKeys(shortcut).typeText('a');

        expect(this.field.getValue()).toEqual(
          document(block(heading, {}, text('a')), EMPTY_PARAGRAPH)
        );
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

function describeAction(description, [formattingOption, shortcut], setupTests) {
  describe(`${description} via toolbar icon`, () => {
    beforeEach(function() {
      this.editorApi.triggerAction = () => this.editorApi.clickIcon(formattingOption);
    });
    setupTests({ actionOrigin: actionOrigin.TOOLBAR });
  });

  describe(`${description} via shortcut ${shortcut}`, () => {
    beforeEach(function() {
      this.editorApi.triggerAction = () => this.editorApi.pressKeys(shortcut);
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
  it('tracks the action event', function() {
    sinon.assert.calledOnceWith(this.props.onAction, action, data);
  });
}
