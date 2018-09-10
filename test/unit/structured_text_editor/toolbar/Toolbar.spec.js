import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import { toKeyCode } from 'is-hotkey';

import { BLOCKS, MARKS } from '@contentful/structured-text-types';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, text, flushPromises, getWithId } from '../helpers';
import { stubAll, setupWidgetApi, createSandbox } from '../setup';

const triggerToolbarIcon = async (wrapper, iconName) => {
  const toolbarIcon = getWithId(wrapper, `toolbar-toggle-${iconName}`);
  toolbarIcon.simulate('mouseDown');
  await flushPromises();
};

const e = (key, opts) => ({
  key,
  keyCode: toKeyCode(key),
  which: toKeyCode(key),
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ctrlKey: false,
  ...opts
});

describe('Toolbar', () => {
  beforeEach(async function() {
    module('contentful/test');

    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));

    this.system = createIsolatedSystem();

    this.entity = { sys: { type: 'Entry', id: 'testid2' } };

    stubAll({ isolatedSystem: this.system, entities: [this.entity] });

    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/index.es6'
    );

    this.widgetApi = setupWidgetApi(this.$inject('mocks/widgetApi'), mockDocument);

    this.props = {
      field: this.widgetApi.field,
      onChange: sinon.spy(),
      widgetAPI: { dialogs: {} }
    };

    this.sandbox = createSandbox(window);
    this.wrapper = mount(<StructuredTextEditor {...this.props} />, { attachTo: this.sandbox });
  });

  afterEach(function() {
    this.sandbox.remove();
  });

  describe('EmbeddedEntryBlock', function() {
    it('renders block', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.EMBEDDED_ENTRY);

      expect(this.widgetApi.field.getValue()).toEqual(
        document(
          block(
            BLOCKS.EMBEDDED_ENTRY,
            {
              target: {
                sys: { id: 'testid2', type: 'Link', linkType: 'Entry' }
              }
            },
            text()
          ),
          block(BLOCKS.PARAGRAPH, {}, text())
        )
      );
    });
  });

  describe('List', function() {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function(listType) {
      it(`renders ${listType}`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(listType, {}, block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text()))),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });

      it(`removes empty ${listType} after second click`, async function() {
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, listType);
        expect(this.widgetApi.field.getValue()).toEqual(
          document(block(BLOCKS.PARAGRAPH, {}, text()), block(BLOCKS.PARAGRAPH, {}, text()))
        );
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
              block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text('')))
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
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
                block(
                  listType,
                  {},
                  block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text('')))
                )
              )
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });

      it('inserts an embedded entry into list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, BLOCKS.EMBEDDED_ENTRY);

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(
                  BLOCKS.EMBEDDED_ENTRY,
                  {
                    target: {
                      sys: { id: 'testid2', type: 'Link', linkType: 'Entry' }
                    }
                  },
                  text()
                ),
                block(BLOCKS.PARAGRAPH, {}, text())
              )
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });

      it('inserts quote inside a list-item', async function() {
        const editor = getWithId(this.wrapper, 'editor');
        editor.getDOMNode().click();
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(
                BLOCKS.LIST_ITEM,
                {},
                block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text()))
              )
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
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
                block(
                  BLOCKS.PARAGRAPH,
                  {},
                  text('golang', [{ type: MARKS.CODE, object: 'mark', data: {} }])
                )
              )
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });
    });
  });

  describe('Quote', function() {
    it('renders the quote', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.widgetApi.field.getValue()).toEqual(
        document(
          block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text())),
          block(BLOCKS.PARAGRAPH, {}, text())
        )
      );
    });

    it('renders the quote with shortcuts', async function() {
      const key = '1';
      const modifier = {
        metaKey: true,
        shiftKey: true
      };
      const editor = getWithId(this.wrapper, 'editor');

      editor.simulate('keyDown', e(key, modifier));
      editor.simulate('beforeinput', { data: 'a' });

      expect(this.widgetApi.field.getValue()).toEqual(
        document(
          block(BLOCKS.QUOTE, {}, block(BLOCKS.PARAGRAPH, {}, text('a'))),
          block(BLOCKS.PARAGRAPH, {}, text())
        )
      );
    });

    it(`removes quote after second click`, async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text()), block(BLOCKS.PARAGRAPH, {}, text()))
      );
    });

    it(`removes quote on Backspace`, async function() {
      const editor = getWithId(this.wrapper, 'editor');
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);

      editor.simulate('keydown', {
        key: 'Backspace',
        keyCode: toKeyCode('Backspace')
      });

      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.PARAGRAPH, {}, text()))
      );
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
          document(
            block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark, object: 'mark', data: {} }]))
          )
        );
      });

      it(`renders the ${mark} with shortcut`, async function() {
        const editor = getWithId(this.wrapper, 'editor');

        editor.simulate('keyDown', e(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(BLOCKS.PARAGRAPH, {}, text('a', [{ type: mark, object: 'mark', data: {} }]))
          )
        );
      });
    });
  });

  describe('HR', function() {
    it('renders the HR', async function() {
      await triggerToolbarIcon(this.wrapper, BLOCKS.HR);
      expect(this.widgetApi.field.getValue()).toEqual(
        document(block(BLOCKS.HR, {}, text()), block(BLOCKS.PARAGRAPH, {}, text()))
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

        editor.simulate('keyDown', e(key, modifier));
        editor.simulate('beforeinput', { data: 'a' });

        expect(this.widgetApi.field.getValue()).toEqual(document(block(heading, {}, text('a'))));
      });
    });
  });
});
