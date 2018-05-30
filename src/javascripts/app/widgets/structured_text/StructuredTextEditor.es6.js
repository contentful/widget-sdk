import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';

import LinkedEntryBlock from './LinkedEntryBlock';
import LinkEntrySelector from './LinkEntrySelector';

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
  }
  state = {
    value:
      this.props.field.getValue() &&
      this.props.field.getValue().document
        ? Value.fromJSON(this.props.field.getValue())
        : initialValue
  };
  onChange = ({ value }) => {
    this.props.field.setValue(value.toJSON());
    this.setState({ value });
  };
  onKeyDown = (_event, change, _editor) => {
    /* eslint no-console: off */
    console.log(change.value.toJSON());
  };
  insertLinkedEntry = linkedEntry => {
    const { value } = this.state;
    const change = value.change();

    change
      .insertBlock(linkedEntry)
      .splitBlock()
      .setBlock('paragraph');

    this.onChange(change);

    return true;
  };
  renderNode = props => {
    if (props.node.type === 'entry') {
      return <LinkedEntryBlock {...props} />;
    }
  };
  render () {
    return (
      <div>
        <LinkEntrySelector
          field={this.props.field}
          onSelect={this.insertLinkedEntry}
        />
        <Editor
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderNode={this.renderNode}
        />
      </div>
    );
  }
}
