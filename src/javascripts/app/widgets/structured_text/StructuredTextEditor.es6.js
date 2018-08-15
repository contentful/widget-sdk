import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';
import TrailingBlock from 'slate-trailing-block';
import { EditorToolbar } from '@contentful/ui-component-library';

import { toSlatejsDocument, toContentfulDocument } from '@contentful/contentful-slatejs-adapter';

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


const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: ''
              }
            ]
          }
        ]
      }
    ]
  }
});

export default class StructuredTextEditor extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired
  };

  constructor (props) {
    super(props);

    // onIsDisabledChanged() immediately dispatches!
    this.offDisabledState = this.props.field.onIsDisabledChanged((isDisabled) => {
      if (this.state) {
        this.setState({ isDisabled });
      } else {
        this.state = {
          headingMenuOpen: false,
          value:
            this.props.field.getValue() &&
            this.props.field.getValue().nodeClass === 'document'
              ? Value.fromJSON({
                object: 'value',
                document: toSlatejsDocument(this.props.field.getValue())
              })
              : initialValue,
          isDisabled
        };
      }
    });
  }

  componentWillUnmount () {
    this.offDisabledState();
  }

  onChange = ({ value }) => {
    /* eslint no-console: off */
    this.props.field.setValue(toContentfulDocument(value.toJSON().document));
    this.setState({ value, headingMenuOpen: false });
  };

  renderToolbar () {
    return (
      <EditorToolbar>
        <HeadingDropdown
          onToggle={this.toggleHeadingMenu}
          isToggleActive={true}
          isOpen={this.state.headingMenuOpen}
          onClose={this.closeHeadingMenu}
          onChange={this.state.value.change()}
        >
          <Heading1
            change={this.state.value.change()}
            onToggle={this.onChange}
            menuIsOpen={this.state.headingMenuOpen}
            extraClassNames="toolbar-h1-toggle"
          />
          <Heading2
            change={this.state.value.change()}
            onToggle={this.onChange}
            menuIsOpen={this.state.headingMenuOpen}
          />
        </HeadingDropdown>
        <Bold change={this.state.value.change()} onToggle={this.onChange} />
        <Italic change={this.state.value.change()} onToggle={this.onChange} />
        <Underlined
          change={this.state.value.change()}
          onToggle={this.onChange}
        />
        <EntryLinkBlock
          change={this.state.value.change()}
          onToggle={this.onChange}
          field={this.props.field}
        />
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
        {!this.state.isDisabled && this.renderToolbar()}
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
