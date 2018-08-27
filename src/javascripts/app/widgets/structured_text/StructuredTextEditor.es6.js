import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import deepEqual from 'fast-deep-equal';

import {
  toSlatejsDocument,
  toContentfulDocument
} from '@contentful/contentful-slatejs-adapter';
import { EditorToolbar } from '@contentful/ui-component-library';

import Bold, { BoldPlugin } from './plugins/Bold';
import Italic, { ItalicPlugin } from './plugins/Italic';
import Underlined, { UnderlinedPlugin } from './plugins/Underlined';
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

import { ParagraphPlugin } from './plugins/Paragraph';
import EntryLinkBlock, { EntryLinkBlockPlugin } from './plugins/EntryLinkBlock';

import schemaJson from './constants/Schema';
import emptyDoc from './constants/EmptyDoc';

const plugins = [
  BoldPlugin(),
  ItalicPlugin(),
  UnderlinedPlugin(),
  Heading1Plugin(),
  Heading2Plugin(),
  Heading3Plugin(),
  Heading4Plugin(),
  Heading5Plugin(),
  Heading6Plugin(),
  ParagraphPlugin(),
  EntryLinkBlockPlugin(),
  TrailingBlock()
];

const schema = Schema.fromJSON(schemaJson);
const initialValue = Value.fromJSON(toSlatejsDocument(emptyDoc));
// We do not want to change the `widgetApi.field` value when these
// operations fire from Slatejs to not trigger unncessary saves.
const ignoredOperations = ['set_value', 'set_node', 'set_selection'];

export default class StructuredTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired
  };
  static defaultProps = {
    value: emptyDoc
  };
  constructor (props) {
    super(props);

    this.state = {
      lastOperations: [],
      value:
        this.props.value && this.props.value.nodeClass === 'document'
          ? Value.fromJSON({
            object: 'value',
            document: toSlatejsDocument(this.props.value)
          })
          : initialValue
    };
  }

  onChange = ({ value, operations }) => {
    const lastOperations = operations
      .filter(o => ignoredOperations.indexOf(o.type) === -1)
      .toJS();
    this.setState({ value, lastOperations, headingMenuOpen: false });
  };
  componentDidUpdate (prevProps) {
    const isIncomingChange = !deepEqual(this.props.value, prevProps.value);
    const contentIsUpdated = this.state.lastOperations.length > 0;
    if (!this.props.isDisabled && contentIsUpdated) {
      this.setState({ lastOperations: [] });
      this.props.onChange(
        toContentfulDocument(this.state.value.document.toJSON())
      );
    } else if (isIncomingChange) {
      this.setState({
        value: Value.fromJSON({
          object: 'value',
          document: toSlatejsDocument(this.props.value)
        })
      });
    }
  }

  renderToolbar () {
    const props = {
      change: this.state.value.change(),
      onToggle: this.onChange,
      disabled: this.props.isDisabled
    };

    return (
      <EditorToolbar>
        <HeadingDropdown
          onToggle={this.toggleHeadingMenu}
          isToggleActive={true}
          isOpen={this.state.headingMenuOpen}
          onClose={this.closeHeadingMenu}
          change={props.change}
          disabled={props.disabled}
        >
          <Paragraph
            {...props}
          />
          <Heading1
            {...props}
            extraClassNames="toolbar-h1-toggle"
          />
          <Heading2 {...props} />
          <Heading3 {...props} />
          <Heading4 {...props} />
          <Heading5 {...props} />
          <Heading6 {...props} />
        </HeadingDropdown>
        <Bold {...props} />
        <Italic {...props} />
        <Underlined {...props} />
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

  render () {
    return (
      <div className="structured-text">
        {this.renderToolbar()}
        <Editor
          data-test-id="editor"
          value={this.state.value}
          onChange={this.onChange}
          plugins={plugins}
          schema={schema}
          readOnly={this.props.isDisabled}
          className="structured-text__editor"
        />
      </div>
    );
  }
}
