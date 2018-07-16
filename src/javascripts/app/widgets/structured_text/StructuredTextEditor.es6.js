import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value, Schema } from 'slate';

import { toSlatejsDocument, toContentfulDocument } from '@contentful/contentful-slatejs-adapter';

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
      this.props.field.getValue() &&
      this.props.field.getValue().category === 'document'
        ? Value.fromJSON({
          object: 'value',
          document: toSlatejsDocument(this.props.field.getValue())
        })
        : initialValue
  };
  onChange = ({ value }) => {
    /* eslint no-console: off */
    this.props.field.setValue(toContentfulDocument(value.toJSON().document));
    console.log('Slate: ', value.toJSON());
    console.log('Contentful: ', this.props.field.getValue());
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
