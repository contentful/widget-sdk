import React from 'react';
import Enzyme from 'enzyme';
import _ from 'lodash';
import { toKeyCode } from 'is-hotkey';

import { BLOCKS, INLINES, MARKS } from '@contentful/structured-text-types';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, inline, text, flushPromises, getWithId, keyChord } from '../helpers';
import { stubAll, setupWidgetApi, createSandbox, ENTRY } from '../setup';

const triggerToolbarIcon = async (wrapper, iconName) => {
  const toolbarIcon = getWithId(wrapper, `toolbar-toggle-${iconName}`);
  toolbarIcon.simulate('mouseDown');
  await flushPromises();
};


const triggerDropdownButton = async (wrapper, dataTestId) => {
  const toolbarIcon = getWithId(wrapper, dataTestId);
  toolbarIcon.find('button').simulate('mouseDown');
  await flushPromises();
};

const EMPTY_PARAGRAPH = block(BLOCKS.PARAGRAPH, {}, text());

describe('Toolbar', () => {
  beforeEach(async function() {
    module('contentful/test');

    const ServicesProvider = this.$inject('ServicesProvider');

    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));

    this.system = createIsolatedSystem();

    this.entity = ENTRY;

    this.system.set('entitySelector', {
      default: {
        openFromField: () => Promise.resolve([this.entity])
      }
    });
    stubAll({ isolatedSystem: this.system, entities: [this.entity] });

    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/index.es6'
    );

    this.widgetApi = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument);

    this.props = {
      field: this.widgetApi.field,
      onChange: sinon.spy(),
      widgetAPI: { dialogs: {} },
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
  });

  afterEach(function() {
    this.wrapper = null;
    this.sandbox.remove();
  });

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
      const editor = getWithId(this.wrapper, 'editor');
      await embedEntryBlock(this.wrapper);
      editor.getDOMNode().click();
      expect(this.widgetApi.field.getValue()).toEqual(
        document(embeddedEntryBlock(), EMPTY_PARAGRAPH)
      );
    });
  });

  describe('EmbeddedEntryInline', function() {
    it('renders inline entry', async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await embedInlineEntry(this.wrapper);
      editor.getDOMNode().click();
      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text(), embeddedEntryInline(), text()))
      );
    });
  });

  describe('List', function() {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function(listType) {
      it(`renders ${listType}`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(listType, {}, block(BLOCKS.LIST_ITEM, {}, EMPTY_PARAGRAPH)),
            EMPTY_PARAGRAPH
          )
        );
      });

      it(`removes empty ${listType} after second click`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, listType);
        expect(this.widgetApi.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
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
        expect(this.widgetApi.field.getValue()).toEqual(
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

        expect(this.widgetApi.field.getValue()).toEqual(
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
        await embedEntryBlock(this.wrapper);
        editor.getDOMNode().click();

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(listType, {}, block(BLOCKS.LIST_ITEM, {}, embeddedEntryBlock(), EMPTY_PARAGRAPH)),
            EMPTY_PARAGRAPH
          )
        );
      });

      it('inserts an inline entry into list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await embedInlineEntry(this.wrapper);
        editor.getDOMNode().click();

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text(), embeddedEntryInline(), text())
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
        await embedInlineEntry(this.wrapper);

        getWithId(this.wrapper, INLINES.EMBEDDED_ENTRY).simulate('click');

        editor.simulate('keyDown', keyChord('enter'));

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.PARAGRAPH, {}, text(), embeddedEntryInline(), text())
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

        expect(this.widgetApi.field.getValue()).toEqual(
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

        expect(this.widgetApi.field.getValue()).toEqual(
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
      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, EMPTY_PARAGRAPH), EMPTY_PARAGRAPH)
      );
    });

    it('renders the quote with shortcuts', async function() {
      const editor = getWithId(this.wrapper, 'editor');

      editor.simulate('keyDown', keyChord('1', { metaKey: true, shiftKey: true }));
      editor.simulate('beforeinput', { data: 'a' });

      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text('a'))), EMPTY_PARAGRAPH)
      );
    });

    it(`removes quote after second click`, async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.widgetApi.field.getValue()).toEqual(document(EMPTY_PARAGRAPH, EMPTY_PARAGRAPH));
    });

    it(`removes quote on Backspace`, async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);

      editor.simulate('keydown', {
        key: 'Backspace',
        keyCode: toKeyCode('Backspace')
      });

      expect(this.widgetApi.field.getValue()).toEqual(document(EMPTY_PARAGRAPH));
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

    marks.forEach(function({ mark, event: { key, modifier } }) {
      it(`renders the ${mark} mark`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        await triggerToolbarIcon(this.wrapper, mark);
        editor.simulate('beforeinput', { data: 'a' });
        expect(this.widgetApi.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });

      it(`renders the ${mark} with shortcut`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        editor.simulate('keyDown', keyChord(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.widgetApi.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark }])))
        );
      });
    });
  });

  describe('HR', function() {
    it('renders the HR', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.HR);
      expect(this.widgetApi.field.getValue()).toEqual(
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

        expect(this.widgetApi.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });

      it(`renders the ${heading} with shortcut`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        editor.simulate('keyDown', keyChord(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.widgetApi.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });
    });
  });
});
function embeddedEntryBlock() {
  const data = {
    target: {
      sys: { id: 'testid2', type: 'Link', linkType: 'Entry' }
    }
  };
  return block(BLOCKS.EMBEDDED_ENTRY, data, text());
}

function embeddedEntryInline() {
  const data = {
    target: {
      sys: { id: 'testid2', type: 'Link', linkType: 'Entry' }
    }
  };
  return inline(INLINES.EMBEDDED_ENTRY, data, text());
}

async function embedEntryBlock(wrapper) {
  await triggerDropdownButton(wrapper, 'toolbar-entry-dropdown-toggle');
  await triggerDropdownButton(wrapper, 'toolbar-toggle-embedded-entry-block');
}

async function embedInlineEntry(wrapper) {
  await triggerDropdownButton(wrapper, 'toolbar-entry-dropdown-toggle');
  await triggerDropdownButton(wrapper, 'toolbar-toggle-embedded-entry-inline');
}
