import React from 'react';
import Enzyme from 'enzyme';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import withTracking from '../withTracking.es6';
import { track } from 'analytics/Analytics.es6';
import { logWarn } from 'logger';

const LOC = class extends React.Component {};

jest.mock('analytics/Analytics.es6');
jest.mock(
  'logger',
  () => ({
    logWarn: jest.fn()
  }),
  { virtual: true }
);

describe('withTracking() returned hoc', () => {
  let setup, props, locNode, locOnAction;

  beforeEach(() => {
    props = {
      widgetAPI: {}
    };
    setup = () => {
      jest.clearAllMocks();
      const HOC = withTracking(LOC);
      const wrapper = Enzyme.shallow(<HOC {...props} />);
      locNode = wrapper.find('LOC');
      locOnAction = locNode ? locNode.props().onAction : null;
    };
  });

  it('renders component passed to withTracking()', () => {
    setup();
    expect(locNode).toHaveLength(1);
  });

  it("passes a callback to loc's `onAction`", () => {
    setup();
    expect(locOnAction).toBeInstanceOf(Function);
  });

  describe("when loc's props.onAction() is called", () => {
    beforeEach(() => {
      props.widgetAPI = {
        field: {
          id: 'FIELD_ID,',
          locale: 'FIELD_LOCALE'
        },
        entry: {
          getSys: () => ({
            id: 'ENTRY_ID',
            contentType: {
              sys: { id: 'CT_ID' }
            }
          })
        }
      };
      setup();
    });

    it('calls logger.logWarn() for unknown action', () => {
      const data = { origin: 'SOME ORIGIN', foo: 'bar', nodeType: 'foo-bar' };
      locOnAction('someUnknownAction', data);

      expect(logWarn).toHaveBeenCalledTimes(1);
      expect(logWarn).toBeCalledWith(
        'Unexpected rich text tracking action `someUnknownActionFooBar`',
        {
          groupingHash: 'UnexpectedRichTextTrackingAction',
          data: {
            trackingActionName: 'someUnknownActionFooBar',
            originalActionName: 'someUnknownAction',
            originalActionData: data
          }
        }
      );
    });

    it('calls analytics.track() for known action', () => {
      locOnAction('insert', { nodeType: 'heading-1', foo: 'bar' });

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toBeCalledWith('text_editor:action', {
        action: 'insertHeading1',
        actionOrigin: null,
        additionalData: { nodeType: 'heading-1', foo: 'bar' },
        characterCountAfter: null,
        characterCountBefore: null,
        characterCountSelection: null,
        contentTypeId: 'CT_ID',
        editorName: 'RichText',
        entryId: 'ENTRY_ID',
        fieldId: 'FIELD_ID,',
        fieldLocale: 'FIELD_LOCALE',
        isFullscreen: false
      });
    });

    it('also invokes `onAction` prop on hoc', () => {
      props.onAction = jest.fn();
      setup();

      const onActionArgs = ['someAction', { foo: 'bar' }];
      locOnAction(...onActionArgs);

      expect(props.onAction).toHaveBeenCalledTimes(1);
      expect(props.onAction).toBeCalledWith(...onActionArgs);
    });

    test.each([
      ['insert', BLOCKS.HEADING_1, 'insertHeading1'],
      ['insert', BLOCKS.HEADING_2, 'insertHeading2'],
      ['insert', BLOCKS.HEADING_3, 'insertHeading3'],
      ['insert', BLOCKS.HEADING_4, 'insertHeading4'],
      ['insert', BLOCKS.HEADING_5, 'insertHeading5'],
      ['insert', BLOCKS.HEADING_6, 'insertHeading6'],
      ['insert', INLINES.HYPERLINK, 'insertHyperlink'],
      ['insert', INLINES.ENTRY_HYPERLINK, 'insertEntryHyperlink'],
      ['insert', INLINES.ASSET_HYPERLINK, 'insertAssetHyperlink'],
      ['insert', INLINES.EMBEDDED_ENTRY, 'insertEmbeddedEntryInline'],
      ['insert', BLOCKS.EMBEDDED_ENTRY, 'insertEmbeddedEntryBlock'],
      ['insert', BLOCKS.EMBEDDED_ASSET, 'insertEmbeddedAssetBlock'],
      ['insert', BLOCKS.QUOTE, 'insertBlockquote'],
      ['insert', BLOCKS.UL_LIST, 'insertUnorderedList'],
      ['insert', BLOCKS.OL_LIST, 'insertOrderedList'],
      ['insert', BLOCKS.HR, 'insertHr'],
      ['insert', BLOCKS.PARAGRAPH, 'insertParagraph'],

      ['remove', BLOCKS.HEADING_1, 'removeHeading1'],
      ['remove', BLOCKS.HEADING_2, 'removeHeading2'],
      ['remove', BLOCKS.HEADING_3, 'removeHeading3'],
      ['remove', BLOCKS.HEADING_4, 'removeHeading4'],
      ['remove', BLOCKS.HEADING_5, 'removeHeading5'],
      ['remove', BLOCKS.HEADING_6, 'removeHeading6'],
      ['remove', BLOCKS.QUOTE, 'removeBlockquote'],
      ['remove', BLOCKS.UL_LIST, 'removeUnorderedList'],
      ['remove', BLOCKS.OL_LIST, 'removeOrderedList'],

      ['edit', INLINES.HYPERLINK, 'editHyperlink'],
      ['edit', INLINES.ENTRY_HYPERLINK, 'editEntryHyperlink'],
      ['edit', INLINES.ASSET_HYPERLINK, 'editAssetHyperlink']
    ])(
      'tracks action "%s" with `data.nodeType = "%s"` as analytics action "%s"',
      (action, nodeType, trackingAction) => {
        locOnAction(action, { nodeType });
        expectTrackedAction(trackingAction);
      }
    );

    test.each([
      ['mark', MARKS.BOLD, 'markBold'],
      ['mark', MARKS.UNDERLINE, 'markUnderline'],
      ['mark', MARKS.ITALIC, 'markItalic'],
      ['mark', MARKS.CODE, 'markCode'],

      ['unmark', MARKS.BOLD, 'unmarkBold'],
      ['unmark', MARKS.UNDERLINE, 'unmarkUnderline'],
      ['unmark', MARKS.ITALIC, 'unmarkItalic'],
      ['unmark', MARKS.CODE, 'unmarkCode']
    ])(
      'tracks action "%s" with `data.markType = "%s"` as analytics action "%s"',
      (action, markType, trackingAction) => {
        locOnAction(action, { markType });
        expectTrackedAction(trackingAction);
      }
    );

    describe.each([
      'paste',
      'unlinkHyperlinks',

      'openCreateHyperlinkDialog',
      'openEditHyperlinkDialog',
      'openCreateEmbedDialogEmbeddedEntryInline',
      'openCreateEmbedDialogEmbeddedEntryBlock',
      'openCreateEmbedDialogEmbeddedAssetBlock',

      'cancelCreateHyperlinkDialog',
      'cancelEditHyperlinkDialog',
      'cancelCreateEmbedDialogEmbeddedEntryInline',
      'cancelCreateEmbedDialogEmbeddedEntryBlock',
      'cancelCreateEmbedDialogEmbeddedAssetBlock'
    ])('action "%s"', action => {
      it('is tracked as analytics action of same name', () => {
        locOnAction(action, {});
        expectTrackedAction(action);
      });

      it('is tracked with `nodeType` and `markType` having no influence', () => {
        locOnAction(action, { nodeType: 'foo', markType: 'bar' });
        expectTrackedAction(action);
      });
    });
  });

  function expectTrackedAction(actionName) {
    expect(track.mock.calls[0][1].action).toBe(actionName);
  }
});
