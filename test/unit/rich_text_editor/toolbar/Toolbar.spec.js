import React from 'react';
import Enzyme from 'enzyme';
import { parseHotkey } from 'is-hotkey';
import { mapValues, forEach, upperFirst } from 'lodash';

import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

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
    this.system.set('app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6', {
      default: this.openHyperlinkDialog
    });
    stubAll({ isolatedSystem: this.system });

    // TODO: Test RichTextEditor without any HOCs here and test HOC separately.
    const { default: RichTextEditor } = await this.system.import('app/widgets/rich_text/index.es6');

    this.field = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument).field;

    this.props = {
      field: this.field,
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
    this.mount();

    this.setup = () => {
      let api = {};
      const editorNode = getWithId(this.wrapper, 'editor');
      const promises = [];
      const chainableApiFn = fn => (...args) => {
        let lastPromise = promises[promises.length - 1] || Promise.resolve();
        lastPromise = lastPromise.then(() => {
          return fn(...args);
        });
        promises.push(lastPromise);
        return Object.assign(Promise.all(promises), api);
      };
      const embedEntity = async (entity, nodeType) => {
        this.selectedEntity = entity;
        await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
        await triggerToolbarIcon(this.wrapper, nodeType);
      };

      api.focus = () => editorNode.getDOMNode().click();
      api.clickIcon = async type => await triggerToolbarIcon(this.wrapper, type);
      api.embedEntryBlock = entry => embedEntity(entry, BLOCKS.EMBEDDED_ENTRY);
      api.embedInlineEntry = entry => embedEntity(entry, INLINES.EMBEDDED_ENTRY);
      api.embedAssetBlock = asset => embedEntity(asset, BLOCKS.EMBEDDED_ASSET);
      api.typeText = text => editorNode.simulate('beforeinput', { data: text });
      api.pressKeys = keys => {
        const event = {
          ...parseHotkey(keys, { byKey: true }),
          ...parseHotkey(keys)
        };
        event.key = upperFirst(event.key);
        editorNode.simulate('keyDown', event);
      };
      api.pressEnter = api.pressKeys.bind(null, 'enter');
      api.pressTab = api.pressKeys.bind(null, 'tab');
      api.pressBackspace = api.pressKeys.bind(null, 'backspace');

      api = mapValues(api, fn => chainableApiFn(fn));
      return { editor: api };
    };
  });

  afterEach(function() {
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
      itSupportsHyperlinkOfType
    );
  });

  function itSupportsHyperlinkOfType(dialogData, linkType) {
    it(`supports "${linkType}" type hyperlink `, async function({ editor }) {
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
            inline(linkType, expectedLinkData, text('a hyperlink')),
            text()
          )
        )
      );
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
    it('inserts the quote', async function({ editor }) {
      await editor.clickIcon(BLOCKS.QUOTE);
      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, EMPTY_PARAGRAPH), EMPTY_PARAGRAPH)
      );
    });

    it('inserts the quote with shortcuts', async function({ editor }) {
      await editor.pressKeys('cmd+shift+1').typeText('a');

      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text('a'))), EMPTY_PARAGRAPH)
      );
    });

    it(`removes quote after second click`, async function({ editor }) {
      await editor.clickIcon(BLOCKS.QUOTE).clickIcon(BLOCKS.QUOTE);

      expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
    });

    it(`removes quote on Backspace`, async function({ editor }) {
      await editor.clickIcon(BLOCKS.QUOTE).pressBackspace();

      expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH));
    });
  });

  describe('Marks', () => {
    const marks = [
      { mark: MARKS.BOLD, shortcut: 'cmd+b' },
      { mark: MARKS.CODE, shortcut: 'cmd+/' },
      { mark: MARKS.ITALIC, shortcut: 'cmd+i' },
      { mark: MARKS.UNDERLINE, shortcut: 'cmd+u' }
    ];

    marks.forEach(({ mark, shortcut }) => {
      it(`inserts the ${mark} mark`, async function({ editor }) {
        await editor.clickIcon(mark).typeText('a');

        expect(this.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });

      it(`inserts the ${mark} with shortcut`, async function({ editor }) {
        await editor.pressKeys(shortcut).typeText('a');

        expect(this.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });
    });
  });

  describe('HR', () => {
    it('inserts the HR', async function({ editor }) {
      await editor.clickIcon(BLOCKS.HR);
      expect(this.field.getValue()).toEqual(document(block(BLOCKS.HR, {}), EMPTY_PARAGRAPH));
    });
  });

  describe('headings', () => {
    const headings = [
      { heading: BLOCKS.HEADING_1, shortcut: 'cmd+opt+1' },
      { heading: BLOCKS.HEADING_2, shortcut: 'cmd+opt+2' },
      { heading: BLOCKS.HEADING_3, shortcut: 'cmd+opt+3' },
      { heading: BLOCKS.HEADING_4, shortcut: 'cmd+opt+4' },
      { heading: BLOCKS.HEADING_5, shortcut: 'cmd+opt+5' },
      { heading: BLOCKS.HEADING_6, shortcut: 'cmd+opt+6' }
    ];

    headings.forEach(function({ heading, shortcut }, index) {
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

      it(`inserts ${heading} with shortcut`, async function({ editor }) {
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
