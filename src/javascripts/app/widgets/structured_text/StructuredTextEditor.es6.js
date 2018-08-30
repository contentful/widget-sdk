import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import deepEqual from 'fast-deep-equal';

import { toSlatejsDocument, toContentfulDocument } from '@contentful/contentful-slatejs-adapter';
import { EditorToolbar, EditorToolbarDivider } from '@contentful/ui-component-library';

import Bold, { BoldPlugin } from './plugins/Bold.es6';
import Italic, { ItalicPlugin } from './plugins/Italic.es6';
import Underlined, { UnderlinedPlugin } from './plugins/Underlined.es6';
import Code, { CodePlugin } from './plugins/Code.es6';
import Quote, { QuotePlugin } from './plugins/Quote.es6';
import Hyperlink, { HyperlinkPlugin } from './plugins/Hyperlink.es6';
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
} from './plugins/Heading.es6';

import NewLinePlugin from './plugins/NewLinePlugin.es6';
import { ParagraphPlugin } from './plugins/Paragraph.es6';
import EntryLinkBlock, { EntryLinkBlockPlugin } from './plugins/EntryLinkBlock.es6';
import EditList from './plugins/List/EditListWrapper.es6';
import { ListPlugin, UnorderedList, OrderedList } from './plugins/List.es6';
import Hr, { HrPlugin } from './plugins/Hr.es6';

import schemaJson from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';

const schema = Schema.fromJSON(schemaJson);
const initialValue = Value.fromJSON(toSlatejsDocument(emptyDoc));
// We do not want to change the `widgetApi.field` value when these
// operations fire from Slatejs to not trigger unnecessary saves.
const ignoredOperations = ['set_value', 'set_selection'];

function validateOperation(op) {
  // We want to allow "set_node" operations where the node
  // type changes like quoting text.
  if (op.type === 'set_node' && !op.properties.type) {
    return false;
  }
  if (ignoredOperations.indexOf(op.type) > -1) {
    return false;
  }
  return true;
}

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
    const lastOperations = operations.filter(validateOperation).toJS();

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
