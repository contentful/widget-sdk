import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';

import Bold, { BoldPlugin } from './plugins/Bold';
import Italic, { ItalicPlugin } from './plugins/Italic';
import Underlined, { UnderlinedPlugin } from './plugins/Underlined';
import {
  Heading1,
  Heading2,
  Heading1Plugin,
  Heading2Plugin
} from './plugins/Heading';
import EntryLinkBlock, { EntryLinkBlockPlugin } from './plugins/EntryLinkBlock';

import schemaJson from './constants/Schema';

const plugins = [
  BoldPlugin(),
  ItalicPlugin(),
  UnderlinedPlugin(),
  Heading1Plugin(),
  Heading2Plugin(),
  EntryLinkBlockPlugin()
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
                text: 'Welcome to fractured content!'
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
  state = {
    value:
      this.props.field.getValue() && this.props.field.getValue().document
        ? Value.fromJSON(this.props.field.getValue())
        : initialValue
  };
  onChange = ({ value }) => {
    this.props.field.setValue(value.toJSON());
    this.setState({ value });
  };
  render () {
    return (
      <div className="structured-text">
        <div className="structured-text__toolbar">
          <Bold change={this.state.value.change()} onToggle={this.onChange} />
          <Italic change={this.state.value.change()} onToggle={this.onChange} />
          <Underlined
            change={this.state.value.change()}
            onToggle={this.onChange}
          />
          <Heading1
            change={this.state.value.change()}
            onToggle={this.onChange}
          />
          <Heading2
            change={this.state.value.change()}
            onToggle={this.onChange}
          />
          <EntryLinkBlock
            change={this.state.value.change()}
            onToggle={this.onChange}
            field={this.props.field}
          />
        </div>
        <Editor
          value={this.state.value}
          onChange={this.onChange}
          plugins={plugins}
          schema={schema}
        />
      </div>
    );
  }
}
