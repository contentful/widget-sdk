import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { document, block, text, flushPromises } from './helpers';

import { BLOCKS } from '@contentful/structured-text-types';

const getWithId = (wrapper, testId) =>
  wrapper.find(`[data-test-id="${testId}"]`).first();

const triggerToolbarIcon = async (wrapper, iconName) => {
  const toolbarIcon = getWithId(wrapper, `toolbar-toggle-${iconName}`);
  toolbarIcon.simulate('mouseDown');
  await flushPromises();
};

describe('Toolbar', () => {
  beforeEach(async function () {
    module('contentful/test');

    const mockDocument = document(block(BLOCKS.PARAGRAPH, {}, text()));

    this.system = createIsolatedSystem();

    this.entity = { sys: { type: 'Entry', id: 'testid2' } };

    this.system.set('ui/cf/thumbnailHelpers', {});
    this.system.set('spaceContext', {});
    this.system.set('$rootScope', {
      default: {
        $on: sinon.stub()
      }
    });
    this.system.set('$location', {
      default: {
        absUrl: () => 'abs-url'
      }
    });
    this.system.set(
      'app/widgets/structured_text/plugins/EntryLinkBlock/FetchEntry',
      {
        default: ({ render }) => {
          return render({
            entry: this.entity,
            entryTitle: 'title',
            entryDescription: 'description',
            entryStatus: 'status',
            loading: { entry: false, thumbnail: true }
          });
        }
      }
    );
    this.system.set('states/EntityNavigationHelpers', {
      goToSlideInEntity: sinon.stub()
    });

    this.system.set('entitySelector', {
      default: {
        openFromField: () => Promise.resolve([this.entity])
      }
    });
    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text'
    );

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.widgetApi.fieldProperties.isDisabled$.set(false);
    this.widgetApi.fieldProperties.value$.set(mockDocument);

    this.props = {
      field: this.widgetApi.field,
      onChange: sinon.spy()
    };
    this.wrapper = mount(<StructuredTextEditor {...this.props} />);
  });
  xdescribe('EmbeddedEntryBlock', function () {
    it('renders block', async function () {
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
          )
        )
      );
    });
  });
  describe('List', function () {
    [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(function (listType) {
      it(`renders ${listType}`, async function () {
        await triggerToolbarIcon(this.wrapper, listType);

        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(
              listType,
              {},
              block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text()))
            ),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });

      it(`removes empty ${listType} after second click`, async function () {
        await triggerToolbarIcon(this.wrapper, listType);
        await triggerToolbarIcon(this.wrapper, listType);
        expect(this.widgetApi.field.getValue()).toEqual(
          document(
            block(BLOCKS.PARAGRAPH, {}, text()),
            block(BLOCKS.PARAGRAPH, {}, text())
          )
        );
      });
    });
  });

  describe('Quote', function () {
    it('renders the quote', async function () {
      await triggerToolbarIcon(this.wrapper, BLOCKS.QUOTE);
      expect(this.widgetApi.field.getValue()).toEqual(document(block(BLOCKS.QUOTE, {}, text())));
    });
  });
});
