import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import deepEqual from 'fast-deep-equal';

import { toContentfulDocument, toSlatejsDocument } from '@contentful/contentful-slatejs-adapter';

import { newPluginAPI } from './plugins/shared/PluginApi.es6';
import { BoldPlugin } from './plugins/Bold/index.es6';
import { ItalicPlugin } from './plugins/Italic/index.es6';
import { UnderlinedPlugin } from './plugins/Underlined/index.es6';
import { CodePlugin } from './plugins/Code/index.es6';
import { QuotePlugin } from './plugins/Quote/index.es6';
import { HyperlinkPlugin } from './plugins/Hyperlink/index.es6';
import {
  Heading1Plugin,
  Heading2Plugin,
  Heading3Plugin,
  Heading4Plugin,
  Heading5Plugin,
  Heading6Plugin
} from './plugins/Heading/index.es6';

import NewLinePlugin from './plugins/NewLinePlugin/index.es6';
import { ParagraphPlugin } from './plugins/Paragraph/index.es6';
import {
  EmbeddedAssetBlockPlugin,
  EmbeddedEntryBlockPlugin
} from './plugins/EmbeddedEntityBlock/index.es6';
import { EmbeddedEntryInlinePlugin } from './plugins/EmbeddedEntryInline/index.es6';

import { ListPlugin } from './plugins/List/index.es6';
import { HrPlugin } from './plugins/Hr/index.es6';

import schema from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import { PasteHtmlPlugin } from './plugins/PasteHtml/index.es6';

import Toolbar from './Toolbar/index.es6';

const noop = () => {};

const createValue = contentfulDocument => {
  const document = toSlatejsDocument({
    document: contentfulDocument,
    schema
  });
  const value = Value.fromJSON({
    document,
    schema
  });

  return value;
};

const initialValue = createValue(emptyDoc);

export default class RichTextEditor extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    value: PropTypes.object.isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onAction: PropTypes.func
  };
  static defaultProps = {
    value: emptyDoc,
    onChange: noop,
    onAction: noop
  };

  constructor(props) {
    super(props);
    const { value } = this.props;

    this.state = {
      lastOperations: [],
      isEmbedDropdownOpen: false,
      value: value && value.nodeType === BLOCKS.DOCUMENT ? createValue(value) : initialValue,
      hasFocus: false
    };
    this.slatePlugins = buildPlugins(newPluginAPI(this.props));
  }

  onChange = change => {
    const { value, operations } = change;
    const lastOperations = operations.filter(isRelevantOperation).toJS();

    this.setState({ value, lastOperations });
  };

  componentDidUpdate({ value: prevCfDoc }) {
    const { value: contentfulDoc, isDisabled, onChange } = this.props;
    const isIncomingChange = () => !deepEqual(contentfulDoc, prevCfDoc);
    const contentIsUpdated = this.state.lastOperations.length > 0;
    if (!isDisabled && contentIsUpdated) {
      this.setState({ lastOperations: [] });
      const slateDoc = this.state.value.document.toJSON();

      onChange(
        toContentfulDocument({
          document: slateDoc,
          schema
        })
      );
    } else if (isIncomingChange()) {
      this.setState({
        value: createValue(contentfulDoc)
      });
    }
  }

  render() {
    const classNames = `
      rich-text
      ${!this.props.isDisabled ? 'rich-text--enabled' : ''}
    `;

    return (
      <div className={classNames}>
        <Toolbar
          change={this.state.value.change()}
          onChange={this.onChange}
          isDisabled={this.props.isDisabled}
          richTextAPI={newPluginAPI(this.props)}
        />
        <Editor
          data-test-id="editor"
          value={this.state.value}
          onChange={this.onChange}
          plugins={this.slatePlugins}
          readOnly={this.props.isDisabled}
          schema={schema}
          className="rich-text__editor"
        />
      </div>
    );
  }
}

/**
 * Returns whether a given operation is relevant enough to trigger a save.
 *
 * @param {slate.Operation} op
 * @returns {boolean}
 */
function isRelevantOperation(op) {
  if (op.type === 'set_node' && !op.properties.type) {
    if (op.properties.type || op.properties.data) {
      // Change of node type or data (e.g. quote or hyperlink)
      return true;
    } else if (op.properties.isVoid) {
      // Triggered for embeds and hr, not an actual data change.
      return false;
    } else {
      throw newUnhandledOpError(op);
    }
  } else if (op.type === 'set_value') {
    if (op.properties.schema) {
      return false;
    } else {
      throw newUnhandledOpError(op);
    }
  } else if (op.type === 'set_selection') {
    return false;
  }
  return true;
}

function newUnhandledOpError(op) {
  const properties = Object.keys(op.properties)
    .map(v => `\`${v}\``)
    .join(',');
  return new Error(`Unhandled operation \`${op.type}\` with properties ${properties}`);
}

function buildPlugins(richTextAPI) {
  return [
    BoldPlugin({ richTextAPI }),
    ItalicPlugin({ richTextAPI }),
    UnderlinedPlugin({ richTextAPI }),
    CodePlugin({ richTextAPI }),
    QuotePlugin({ richTextAPI }),
    HyperlinkPlugin({ richTextAPI }),
    Heading1Plugin({ richTextAPI }),
    Heading2Plugin({ richTextAPI }),
    Heading3Plugin({ richTextAPI }),
    Heading4Plugin({ richTextAPI }),
    Heading5Plugin({ richTextAPI }),
    Heading6Plugin({ richTextAPI }),
    ParagraphPlugin(),
    HrPlugin({ richTextAPI }),
    EmbeddedEntryInlinePlugin({ richTextAPI }),
    EmbeddedEntryBlockPlugin({ richTextAPI }),
    EmbeddedAssetBlockPlugin({ richTextAPI }),
    ListPlugin({ richTextAPI }),
    PasteHtmlPlugin(),
    TrailingBlock({ type: BLOCKS.PARAGRAPH }),
    NewLinePlugin()
  ];
}
