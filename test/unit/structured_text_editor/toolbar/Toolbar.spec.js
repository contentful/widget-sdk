import React from 'react';
import Enzyme from 'enzyme';
import { toKeyCode } from 'is-hotkey';
import { forEach } from 'lodash';

import { BLOCKS, INLINES, MARKS } from '@contentful/structured-text-types';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, inline, text, flushPromises, getWithId, keyChord } from '../helpers';
import { stubAll, setupWidgetApi, createSandbox, ENTRY } from '../setup';

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
    this.hyperlinkData = {};
    this.system.set('app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6', {
      default: () => Promise.resolve(this.hyperlinkData)
    });
    stubAll({ isolatedSystem: this.system });

    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/index.es6'
    );

    this.field = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument).field;

    this.props = {
      field: this.field,
      onChange: sinon.spy(),
      features: { embedInlineEntry: true }
    };
    this.sandbox = createSandbox(window);

    this.mount = (props = this.props) => {
      this.wrapper = Enzyme.mount(
        <ServicesProvider>
          <StructuredTextEditor {...props} />
        </ServicesProvider>,
        { attachTo: this.sandbox }
      );
    };
    this.mount();

    this.embedEntryBlock = async entity => {
      this.selectedEntity = entity;
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      await triggerToolbarIcon(this.wrapper, BLOCKS.EMBEDDED_ENTRY);
    };

    this.embedAssetBlock = async asset => {
      this.selectedEntity = asset;
      await triggerToolbarIcon(this.wrapper, BLOCKS.EMBEDDED_ASSET);
    };

    this.embedInlineEntry = async entry => {
      this.selectedEntity = entry;
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      await triggerToolbarIcon(this.wrapper, INLINES.EMBEDDED_ENTRY);
    };
  });

  afterEach(function() {
    this.wrapper = null;
    this.sandbox.remove();
  });

  describe('Hyperlink', function() {
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
    it(`supports "${linkType}" type hyperlink `, async function() {
      this.hyperlinkData = { text: 'a hyperlink', ...dialogData };
      const { target, uri } = dialogData;
      const expectedLinkData = target ? { target } : { uri };
      await triggerToolbarIcon(this.wrapper, INLINES.HYPERLINK);
      await flushPromises();
      expect(this.field.getValue()).toEqual(
        document(
          block(
            BLOCKS.PARAGRAPH,
            {},
            text(),
            inline(linkType, expectedLinkData, text(this.hyperlinkData.text)),
            text()
          )
        )
      );
    });
  }

  describe('Embed Dropdown', function() {
    it('renders the embed dropdown', async function() {
      await triggerDropdownButton(this.wrapper, 'toolbar-entry-dropdown-toggle');
      expect(getWithId(this.wrapper, 'cf-ui-dropdown-list').getDOMNode()).toBeDefined();
    });

    it('renders the embed block button', async function() {
      this.mount({ ...this.props, features: { embedInlineEntry: false } });
      expect(
        getWithId(this.wrapper, `toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`).getDOMNode()
      ).toBeDefined();
    });
  });

  describe('EmbeddedEntryBlock', function() {
    it('renders block', async function() {
      await this.embedEntryBlock(ENTRY);

      // TODO: Why do we need this, can we move it into a single descriptive fn in all tests?
      const editor = getWithId(this.wrapper, 'editor');
      editor.getDOMNode().click();

      expect(this.field.getValue()).toEqual(
        document(newEmbeddedEntityBlock(ENTRY), EMPTY_PARAGRAPH)
      );
    });
  });

  xdescribe('EmbeddedAssetBlock', function() {
    it('renders block', async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await this.embedAssetBlock(ASSET);
      editor.getDOMNode().click();
      expect(this.field.getValue()).toEqual(
        document(newEmbeddedEntityBlock(ASSET), EMPTY_PARAGRAPH)
      );
    });
  });

  describe('EmbeddedEntryInline', function() {
    it('renders inline entry', async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await this.embedInlineEntry(ENTRY);
      editor.getDOMNode().click();
      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text(), newEmbeddedEntryInline(ENTRY), text()))
      );
    });
  });

  describe('List', function() {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function(listType) {
      it(`renders ${listType}`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);

        expect(this.field.getValue()).toEqual(
          document(
            block(listType, {}, block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH)),
            EMPTY_PARAGRAPH
          )
        );
      });

      it(`removes empty ${listType} after second click`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, listType);
        expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
      });

      it('inserts text into list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);

        editor.simulate('beforeinput', { data: 'a' });
        editor.simulate('beforeinput', { data: 'b' });

        editor.simulate('keydown', {
          key: 'Enter',
          keyCode: toKeyCode('enter')
        });
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

      it('inserts nested list-item when tab is pressed', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);

        editor.simulate('beforeinput', { data: 'a' });
        editor.simulate('keydown', {
          key: 'Enter',
          keyCode: toKeyCode('enter')
        });

        editor.simulate('keydown', {
          key: 'Tab',
          keyCode: toKeyCode('tab')
        });

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

      it('inserts an embedded entry into list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await this.embedEntryBlock(ENTRY);
        editor.getDOMNode().click();

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

      it('inserts an inline entry into list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await this.embedInlineEntry(ENTRY);
        editor.getDOMNode().click();

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

      xit("doesn't duplicate inline entry on the next line", async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await this.embedInlineEntry(ENTRY);

        getWithId(this.wrapper, INLINES.EMBEDDED_ENTRY).simulate('click');

        editor.simulate('keyDown', keyChord('enter'));

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

      it('inserts quote inside a list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
        editor.getDOMNode().click();

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

      it('inserts a mark inside a list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, MARKS.CODE);
        editor.simulate('beforeinput', { data: 'golang' });

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

  describe('Quote', function() {
    it('renders the quote', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, EMPTY_PARAGRAPH), EMPTY_PARAGRAPH)
      );
    });

    it('renders the quote with shortcuts', async function() {
      const editor = getWithId(this.wrapper, 'editor');

      editor.simulate('keyDown', keyChord('1', { metaKey: true, shiftKey: true }));
      editor.simulate('beforeinput', { data: 'a' });

      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text('a'))), EMPTY_PARAGRAPH)
      );
    });

    it(`removes quote after second click`, async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
    });

    it(`removes quote on Backspace`, async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);

      editor.simulate('keydown', keyChord('backspace'));

      expect(this.field.getValue()).toEqual(document(EMPTY_PARAGRAPH));
    });
  });

  describe('Marks', function() {
    const modifier = { metaKey: true };
    const marks = [
      { mark: MARKS.BOLD, event: { key: 'b', modifier } },
      { mark: MARKS.CODE, event: { key: '/', modifier } },
      { mark: MARKS.ITALIC, event: { key: 'i', modifier } },
      { mark: MARKS.UNDERLINE, event: { key: 'u', modifier } }
    ];

    marks.forEach(({ mark, event: { key, modifier } }) => {
      it(`renders the ${mark} mark`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        await triggerToolbarIcon(this.wrapper, mark);
        editor.simulate('beforeinput', { data: 'a' });
        expect(this.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });

      it(`renders the ${mark} with shortcut`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        editor.simulate('keyDown', keyChord(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });
    });
  });

  describe('HR', function() {
    it('renders the HR', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.HR);
      expect(this.field.getValue()).toEqual(
        document(block(BLOCKS.HR, {}, text()), EMPTY_PARAGRAPH)
      );
    });
  });

  describe('headings', function() {
    const modifier = {
      metaKey: true,
      altKey: true
    };
    const headings = [
      { heading: BLOCKS.HEADING_1, event: { key: '1', modifier } },
      { heading: BLOCKS.HEADING_2, event: { key: '2', modifier } },
      { heading: BLOCKS.HEADING_3, event: { key: '3', modifier } },
      { heading: BLOCKS.HEADING_4, event: { key: '4', modifier } },
      { heading: BLOCKS.HEADING_5, event: { key: '5', modifier } },
      { heading: BLOCKS.HEADING_6, event: { key: '6', modifier } }
    ];

    headings.forEach(function({ heading, event: { key, modifier } }, index) {
      it(`renders ${heading}`, async function() {
        const editor = getWithId(this.wrapper, 'editor');
        const dropdown = getWithId(this.wrapper, 'toolbar-heading-toggle');

        dropdown.simulate('mousedown');
        getWithId(this.wrapper, `heading-${index + 1}`)
          .find('[data-test-id="cf-ui-dropdown-list-item-button"]')
          .first()
          .simulate('mousedown');
        await flushPromises();
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });

      it(`renders the ${heading} with shortcut`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        editor.simulate('keyDown', keyChord(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

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
  return block(BLOCKS[entityBlockName], data, text());
}

function newEmbeddedEntryInline(entity) {
  const { id } = entity.sys;
  const data = {
    target: {
      sys: { id, type: 'Link', linkType: 'Entry' }
    }
  };
  return inline(INLINES.EMBEDDED_ENTRY, data, text());
}
