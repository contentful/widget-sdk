import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import deepEqual from 'fast-deep-equal';

import { toSlatejsDocument, toContentfulDocument } from '@contentful/contentful-slatejs-adapter';
import { EditorToolbar, EditorToolbarDivider } from '@contentful/ui-component-library';

import Bold, { BoldPlugin } from './plugins/Bold';
import Italic, { ItalicPlugin } from './plugins/Italic';
import Underlined, { UnderlinedPlugin } from './plugins/Underlined';
import Code, { CodePlugin } from './plugins/Code';
import Quote, { QuotePlugin } from './plugins/Quote';
import Hyperlink, { HyperlinkPlugin } from './plugins/Hyperlink';
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
} from './plugins/Heading';

import NewLinePlugin from './plugins/NewLinePlugin';
import { ParagraphPlugin } from './plugins/Paragraph';
import EntryLinkBlock, { EntryLinkBlockPlugin } from './plugins/EntryLinkBlock';
import EditList from './plugins/List/EditListWrapper.es6';
import { ListPlugin, UnorderedList, OrderedList } from './plugins/List';
import Hr, { HrPlugin } from './plugins/Hr';

import schemaJson from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';

const schema = Schema.fromJSON(schemaJson);
const initialValue = Value.fromJSON(toSlatejsDocument(emptyDoc));

export default class StructuredTextEditor extends React.Component {
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
      value:
        value && value.nodeClass === 'document'
          ? Value.fromJSON({
              object: 'value',
              document: toSlatejsDocument(value)
            })
          : initialValue,
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
    const { value: cfDoc, isDisabled, onChange } = this.props;
    const isIncomingChange = () => !deepEqual(cfDoc, prevCfDoc);
    const contentIsUpdated = this.state.lastOperations.length > 0;
    if (!isDisabled && contentIsUpdated) {
      this.setState({ lastOperations: [] });
      const slateDoc = this.state.value.document.toJSON();
      const newCfDoc = toContentfulDocument(slateDoc);
      onChange(newCfDoc);
    } else if (isIncomingChange()) {
      this.setState({
        value: Value.fromJSON({
          object: 'value',
          document: toSlatejsDocument(cfDoc)
        })
      });
    }
  }

  renderToolbar() {
    const props = {
      change: this.state.value.change(),
      onToggle: this.onChange,
      disabled: this.props.isDisabled
    };

    return (
      <EditorToolbar extraClassNames="structured-text__toolbar" data-test-id="toolbar">
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
        <EntryLinkBlock {...props} />
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
      structured-text
      ${!this.props.isDisabled ? 'structured-text--enabled' : ''}
    `;

    return (
      <div className={classNames}>
        {this.renderToolbar()}
        <Editor
          data-test-id="editor"
          value={this.state.value}
          onChange={this.onChange}
          plugins={this.slatePlugins}
          schema={schema}
          readOnly={this.props.isDisabled}
          className="structured-text__editor"
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
    EntryLinkBlockPlugin(),
    EditList(),
    ListPlugin(),
    TrailingBlock(),
    NewLinePlugin()
  ];
}
