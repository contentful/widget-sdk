import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import { noop } from 'lodash';
import cn from 'classnames';

import deepEqual from 'fast-deep-equal';
import StickyToolbarWrapper from './Toolbar/StickyToolbarWrapper.es6';

import { toContentfulDocument, toSlatejsDocument } from '@contentful/contentful-slatejs-adapter';

import { newPluginAPI } from './plugins/shared/PluginApi.es6';
import { buildPlugins } from './plugins/index.es6';

import schema from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';
import { BLOCKS } from '@contentful/rich-text-types';

import Toolbar from './Toolbar/index.es6';

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

  state = {
    lastOperations: [],
    isEmbedDropdownOpen: false,
    value:
      this.props.value && this.props.value.nodeType === BLOCKS.DOCUMENT
        ? createValue(this.props.value)
        : initialValue,
    hasFocus: false
  };

  slatePlugins = buildPlugins(
    newPluginAPI({
      widgetAPI: this.props.widgetAPI,
      onAction: this.props.onAction
    })
  );

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
      onChange(
        toContentfulDocument({
          document: this.state.value.document.toJSON(),
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
    const classNames = cn('rich-text', {
      'rich-text--enabled': !this.props.isDisabled
    });

    return (
      <div className={classNames}>
        <StickyToolbarWrapper isDisabled={this.props.isDisabled}>
          <Toolbar
            change={this.state.value.change()}
            onChange={this.onChange}
            isDisabled={this.props.isDisabled}
            richTextAPI={newPluginAPI({
              widgetAPI: this.props.widgetAPI,
              onAction: this.props.onAction
            })}
          />
        </StickyToolbarWrapper>
        <Editor
          data-test-id="editor"
          value={this.state.value}
          onChange={this.onChange}
          onPaste={this.onPaste}
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
