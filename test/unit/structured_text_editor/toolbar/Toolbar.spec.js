import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import { toKeyCode } from 'is-hotkey';

import { BLOCKS } from '@contentful/structured-text-types';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, text, flushPromises, getWithId } from '../helpers';
import { stubAll, setupWidgetApi, createSandbox } from '../setup';

const triggerToolbarIcon = async (wrapper, iconName) => {
  const toolbarIcon = getWithId(wrapper, `toolbar-toggle-${iconName}`);
  toolbarIcon.simulate('mouseDown');
  await flushPromises();
};

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
});
