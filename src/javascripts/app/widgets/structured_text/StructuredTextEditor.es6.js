import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';
import TrailingBlock from 'slate-trailing-block';

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
  Heading1Plugin,
  Heading2Plugin,
  HeadingDropdown
} from './plugins/Heading';
import EntryLinkBlock, { EntryLinkBlockPlugin } from './plugins/EntryLinkBlock';

import schemaJson from './constants/Schema';
import emptyDoc from './constants/EmptyDoc';

const plugins = [
  BoldPlugin(),
  ItalicPlugin(),
  UnderlinedPlugin(),
  Heading1Plugin(),
  Heading2Plugin(),
  EntryLinkBlockPlugin(),
  TrailingBlock()
];

const schema = Schema.fromJSON(schemaJson);
const initialValue = Value.fromJSON(toSlatejsDocument(emptyDoc));

export default class StructuredTextEditor extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    value: PropTypes.object.isRequired,
    readOnly: PropTypes.bool
  };
  static defaultProps = {
    value: emptyDoc,
    readOnly: false
  };
  constructor (props) {
    let isDisabledInitially = true;

    super(props);

    // onIsDisabledChanged() should immediately dispatch but it seems this is
    // not always the case.
    this.offDisabledState = this.props.field.onIsDisabledChanged((isDisabled) => {
      if (this.state) {
        this.setState({ isDisabled });
      } else {
        isDisabledInitially = isDisabled;
      }
    });

    this.state = {
      value:
        this.props.field.getValue() &&
        this.props.field.getValue().nodeClass === 'document'
          ? Value.fromJSON({
            object: 'value',
            document: toSlatejsDocument(this.props.field.getValue())
          })
          : initialValue,
      isDisabled: isDisabledInitially
    };
    this.offValueChanged = this.props.field.onValueChanged(this.handleIncomingChanges);
  }

  componentWillUnmount () {
    this.offDisabledState();
  }

  onChange = ({ value }) => {
    this.setState({ value, headingMenuOpen: false });
  };
  componentDidUpdate () {
    const isInComingChange = this.state.isDisabled === true;
    if (!isInComingChange) {
      this.props.field.setValue(
        toContentfulDocument(this.state.value.document.toJSON())
      );
    }
  }
  handleDisabledChange = (isDisabled) => {
    if (this.state.isDisabled !== isDisabled) {
      this.setState({ isDisabled });
    }
  }
  /**
   * Handles incoming changes in readOnly mode, meaning the field is being
   * edited by an other user simultanously.
   */
  handleIncomingChanges = (nextValue = initialValue) => {
    if (this.state.isDisabled) {
      const slateDoc = Value.fromJSON({
        object: 'value',
        document: toSlatejsDocument(nextValue)
      });
      this.setState({
        value: slateDoc
      });
    }
  };
  renderToolbar () {
    const props = {
      change: this.state.value.change(),
      onToggle: this.onChange,
      disabled: this.state.isDisabled
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
          <Heading1 {...props}
            menuIsOpen={this.state.headingMenuOpen}
            extraClassNames="toolbar-h1-toggle"
          />
          <Heading2 {...props}
            menuIsOpen={this.state.headingMenuOpen}
          />
        </HeadingDropdown>
        <Bold {...props} />
        <Italic {...props} />
        <Underlined {...props} />
        <EntryLinkBlock {...props} field={this.props.field} />
      </EditorToolbar>
    );
  }

  toggleHeadingMenu = event => {
    event.preventDefault();
    this.setState({
      headingMenuOpen: !this.state.headingMenuOpen
    });
  };

  closeHeadingMenu = () => this.setState({
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
          readOnly={this.state.isDisabled}
          className="structured-text__editor"
        />
      </div>
    );
  }
}
