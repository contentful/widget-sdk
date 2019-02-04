import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
const debounce = getModule('debounce');
import { Editor } from '@contentful/slate-react';
import { Value, Editor as EmptyEditor } from 'slate';
import { noop } from 'lodash';
import { List, is } from 'immutable';
import cn from 'classnames';

import deepEqual from 'fast-deep-equal';
import StickyToolbarWrapper from './Toolbar/StickyToolbarWrapper.es6';

import { toContentfulDocument, toSlatejsDocument } from '@contentful/contentful-slatejs-adapter';

import { createRichTextAPI } from './plugins/shared/PluginApi.es6';
import { buildPlugins } from './plugins/index.es6';

import schema from './constants/Schema.es6';
import emptyDoc from './constants/EmptyDoc.es6';
import { BLOCKS } from '@contentful/rich-text-types';

import Toolbar from './Toolbar/index.es6';

const createSlateValue = contentfulDocument => {
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

const emptySlateValue = createSlateValue(emptyDoc);

export default class RichTextEditor extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.shape({
      permissions: PropTypes.shape({
        canAccessAssets: PropTypes.bool.isRequired
      }).isRequired
    }).isRequired,
    value: PropTypes.object.isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onAction: PropTypes.func,
    isToolbarHidden: PropTypes.bool,
    actionsDisabled: PropTypes.bool
  };

  static defaultProps = {
    value: emptyDoc,
    onChange: noop,
    onAction: noop,
    isToolbarHidden: false,
    actionsDisabled: false
  };

  state = {
    lastOperations: List(),
    isEmbedDropdownOpen: false,
    value:
      this.props.value && this.props.value.nodeType === BLOCKS.DOCUMENT
        ? createSlateValue(this.props.value)
        : emptySlateValue,
    hasFocus: false
  };

  editor = React.createRef();

  slatePlugins = buildPlugins(
    createRichTextAPI({
      widgetAPI: this.props.widgetAPI,
      onAction: this.props.onAction
    })
  );

  onChange = editor => {
    const { value, operations } = editor;

    this.setState({
      value,
      lastOperations: operations.filter(isRelevantOperation)
    });
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.isDisabled !== nextProps.isDisabled) {
      return true;
    }
    if (is(this.state.value, nextState.value) && this.props.value === nextProps.value) {
      return false;
    } else {
      return true;
    }
  }
  callOnChange = debounce(() => {
    const doc = toContentfulDocument({
      document: this.state.value.document.toJSON(),
      schema
    });
    this.props.onChange(doc);
  }, 500);
  componentDidUpdate(prevProps) {
    const isIncomingChange = () => !deepEqual(prevProps.value, this.props.value);
    const isDocumentChanged = !this.state.lastOperations.isEmpty();

    if (!this.props.isDisabled && isDocumentChanged) {
      this.setState({ lastOperations: List() }, () => this.callOnChange());
    } else if (isIncomingChange()) {
      this.setState({
        value: createSlateValue(this.props.value)
      });
    }
  }
  render() {
    const classNames = cn('rich-text', {
      'rich-text--enabled': !this.props.isDisabled,
      'rich-text--hidden-toolbar': this.props.isToolbarHidden
    });

    return (
      <div className={classNames}>
        {!this.props.isToolbarHidden && (
          <StickyToolbarWrapper isDisabled={this.props.isDisabled}>
            <Toolbar
              editor={this.editor.current || new EmptyEditor({ readOnly: true })}
              onChange={this.onChange}
              isDisabled={this.props.isDisabled}
              permissions={this.props.widgetAPI.permissions}
              richTextAPI={createRichTextAPI({
                widgetAPI: this.props.widgetAPI,
                onAction: this.props.onAction
              })}
            />
          </StickyToolbarWrapper>
        )}

        <Editor
          data-test-id="editor"
          value={this.state.value}
          ref={this.editor}
          onChange={this.onChange}
          plugins={this.slatePlugins}
          readOnly={this.props.isDisabled}
          className="rich-text__editor"
          actionsDisabled={this.props.actionsDisabled}
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
    if (op.properties.schema || op.properties.data) {
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
