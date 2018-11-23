import React from 'react';
import Enzyme from 'enzyme';

import Toolbar from '../index.es6';
import ValidationType, {
  VALIDATABLE_NODE_TYPES
} from '../../../../../components/field_dialog/RichTextValidationType.es6';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

const fakeProps = () => ({
  isDisabled: false,
  change: {
    value: {
      blocks: [],
      inlines: [],
      activeMarks: [],
      selection: {}
    }
  },
  onChange: jest.fn(),
  richTextAPI: {
    logAction: jest.fn(),
    widgetAPI: {
      features: {
        embedInlineEntry: true
      },
      field: {}
    }
  }
});

describe('Toolbar', () => {
  it('renders toolbar icons', () => {
    const toolbar = Enzyme.mount(<Toolbar {...fakeProps()} />);
    expect(toolbar).toMatchSnapshot();
  });

  it('renders no icons if no formatting options enabled', () => {
    const props = fakeProps();
    props.richTextAPI.widgetAPI.field.validations = [
      { [ValidationType.ENABLED_NODE_TYPES]: [] },
      { [ValidationType.ENABLED_MARKS]: [] }
    ];
    const toolbar = Enzyme.mount(<Toolbar {...props} />);
    expect(toolbar).toMatchSnapshot();
  });

  it('hides group separator if no marks enabled', () => {
    const props = fakeProps();
    props.richTextAPI.widgetAPI.field.validations = [{ [ValidationType.ENABLED_MARKS]: [] }];
    const toolbar = Enzyme.mount(<Toolbar {...props} />);
    expect(toolbar.find('[data-test-id="mark-divider"]')).toHaveLength(0);
  });

  it('hides group separator if no lists, quotes, or hr enabled', () => {
    const props = fakeProps();
    props.richTextAPI.widgetAPI.field.validations = [
      {
        [ValidationType.ENABLED_NODE_TYPES]: [
          VALIDATABLE_NODE_TYPES.filter(
            nodeType =>
              ![BLOCKS.OL_LIST, BLOCKS.UL_LIST, BLOCKS.QUOTE, BLOCKS.HR].includes(nodeType)
          )
        ]
      }
    ];
    const toolbar = Enzyme.mount(<Toolbar {...props} />);
    expect(toolbar.find('[data-test-id="list-divider"]')).toHaveLength(0);
  });

  it('hides group separator if no hyperlinks enabled', () => {
    const props = fakeProps();
    props.richTextAPI.widgetAPI.field.validations = [
      {
        [ValidationType.ENABLED_NODE_TYPES]: [
          VALIDATABLE_NODE_TYPES.filter(
            nodeType =>
              ![INLINES.ASSET_HYPERLINK, INLINES.HYPERLINK, INLINES.ENTRY_HYPERLINK].includes(
                nodeType
              )
          )
        ]
      }
    ];
    const toolbar = Enzyme.mount(<Toolbar {...props} />);
    expect(toolbar.find('[data-test-id="hyperlink-divider"]')).toHaveLength(0);
  });

  it('hides embeds dropdown when no embeds enabled', () => {
    const props = fakeProps();
    props.richTextAPI.widgetAPI.field.validations = [
      {
        [ValidationType.ENABLED_NODE_TYPES]: [
          VALIDATABLE_NODE_TYPES.filter(
            nodeType =>
              ![BLOCKS.EMBEDDED_ASSET, BLOCKS.EMBEDDED_ENTRY, INLINES.EMBEDDED_ENTRY].includes(
                nodeType
              )
          )
        ]
      }
    ];
    const toolbar = Enzyme.mount(<Toolbar {...props} />);
    expect(toolbar.find('[data-test-id="toolbar-entry-dropdown-toggle"]')).toHaveLength(0);
  });
});
