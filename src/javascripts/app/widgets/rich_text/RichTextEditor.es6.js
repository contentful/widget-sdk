import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import deepEqual from 'fast-deep-equal';

import { toSlatejsDocument, toContentfulDocument } from '@contentful/contentful-slatejs-adapter';
import { EditorToolbar, EditorToolbarDivider } from '@contentful/ui-component-library';

import Bold, { BoldPlugin } from './plugins/Bold/index.es6';
import Italic, { ItalicPlugin } from './plugins/Italic/index.es6';
import Underlined, { UnderlinedPlugin } from './plugins/Underlined/index.es6';
import Code, { CodePlugin } from './plugins/Code/index.es6';
import Quote, { QuotePlugin } from './plugins/Quote/index.es6';
import Hyperlink, { HyperlinkPlugin } from './plugins/Hyperlink/index.es6';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Paragraph,
  Heading1Plugin,
  Heading2Plugin,
  Heading3Plugin,
  Heading4Plugin,
  Heading5Plugin,
  Heading6Plugin,
  HeadingDropdown
} from './plugins/Heading/index.es6';

import NewLinePlugin from './plugins/NewLinePlugin/index.es6';
import { ParagraphPlugin } from './plugins/Paragraph/index.es6';
import EmbeddedEntityBlock, {
  EmbeddedEntryBlockPlugin,
  EmbeddedAssetBlockPlugin
} from './plugins/EmbeddedEntityBlock/index.es6';
import EmbeddedEntryInline, {
  EmbeddedEntryInlinePlugin
} from './plugins/EmbeddedEntryInline/index.es6';
import EntryEmbedDropdown from './plugins/EntryEmbedDropdown/index.es6';
import EditList from './plugins/List/EditListWrapper.es6';
import { ListPlugin, UnorderedList, OrderedList } from './plugins/List/index.es6';
import Hr, { HrPlugin } from './plugins/Hr/index.es6';

import schema from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import { PasteHtmlPlugin } from './plugins/PasteHtml/index.es6';

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
    onChange: PropTypes.func.isRequired
  };
  static defaultProps = {
    value: emptyDoc
  };

  constructor(props) {
    super(props);
    const { value, widgetAPI } = this.props;

    this.state = {
      lastOperations: [],
      isEmbedDropdownOpen: false,
      value: value && value.nodeType === BLOCKS.DOCUMENT ? createValue(value) : initialValue,
      hasFocus: false
    };
    this.slatePlugins = buildPlugins(widgetAPI);
  }

  onChange = change => {
    const { value, operations } = change;
    const lastOperations = operations.filter(isRelevantOperation).toJS();

    this.setState({ value, lastOperations, headingMenuOpen: false });
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

  toggleEmbedDropdown = () =>
    this.setState({
      isEmbedDropdownOpen: !this.state.isEmbedDropdownOpen
    });

  handleEmbedDropdownClose = () =>
    this.setState({
      isEmbedDropdownOpen: false
    });

  renderEmbeds = props => (
    <React.Fragment>
      <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ASSET} isButton {...props} />
      {this.props.widgetAPI.features.embedInlineEntry ? (
        <EntryEmbedDropdown
          onToggle={this.toggleEmbedDropdown}
          isOpen={this.state.isEmbedDropdownOpen}
          disabled={props.disabled}
          onClose={this.handleEmbedDropdownClose}>
          <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ENTRY} {...props} />
          <EmbeddedEntryInline {...props} />
        </EntryEmbedDropdown>
      ) : (
        <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ENTRY} isButton {...props} />
      )}
    </React.Fragment>
  );

  renderToolbar() {
    const props = {
      change: this.state.value.change(),
      onToggle: this.onChange,
      disabled: this.props.isDisabled
    };

    return (
      <EditorToolbar extraClassNames="rich-text__toolbar" data-test-id="toolbar">
        <div className="rich-text__toolbar__action-wrapper">
          <HeadingDropdown
            onToggle={this.toggleHeadingMenu}
            isToggleActive={true}
            isOpen={this.state.headingMenuOpen}
            onClose={this.closeHeadingMenu}
            change={props.change}
            disabled={props.disabled}>
            <Paragraph {...props} />
            <Heading1 {...props} extraClassNames="toolbar-h1-toggle" />
            <Heading2 {...props} />
            <Heading3 {...props} />
            <Heading4 {...props} />
            <Heading5 {...props} />
            <Heading6 {...props} />
          </HeadingDropdown>
          <EditorToolbarDivider />
          <Bold {...props} />
          <Italic {...props} />
          <Underlined {...props} />
          <Code {...props} />
          <EditorToolbarDivider />
          <Hyperlink {...props} />
          <EditorToolbarDivider />
          <UnorderedList {...props} />
          <OrderedList {...props} />
          <Quote {...props} />
          <Hr {...props} />
        </div>
        {this.renderEmbeds(props)}
      </EditorToolbar>
    );
  }

  toggleHeadingMenu = event => {
    event.preventDefault();
    this.setState({
      headingMenuOpen: !this.state.headingMenuOpen
    });
  };

  closeHeadingMenu = () =>
    this.setState({
      headingMenuOpen: false
    });

  render() {
    const classNames = `
      rich-text
      ${!this.props.isDisabled ? 'rich-text--enabled' : ''}
    `;

    return (
      <div className={classNames}>
        {this.renderToolbar()}
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

function buildPlugins(widgetAPI) {
  const HyperlinkOptions = {
    createHyperlinkDialog: widgetAPI.dialogs.createHyperlink
  };

  return [
    BoldPlugin(),
    ItalicPlugin(),
    QuotePlugin(),
    UnderlinedPlugin(),
    CodePlugin(),
    HyperlinkPlugin(HyperlinkOptions),
    Heading1Plugin(),
    Heading2Plugin(),
    Heading3Plugin(),
    Heading4Plugin(),
    Heading5Plugin(),
    Heading6Plugin(),
    ParagraphPlugin(),
    HrPlugin(),
    EmbeddedEntryInlinePlugin({ widgetAPI }),
    EmbeddedEntryBlockPlugin({ widgetAPI }),
    EmbeddedAssetBlockPlugin({ widgetAPI }),

    EditList(),
    ListPlugin(),
    PasteHtmlPlugin(),
    TrailingBlock({ type: BLOCKS.PARAGRAPH }),
    NewLinePlugin()
  ];
}
