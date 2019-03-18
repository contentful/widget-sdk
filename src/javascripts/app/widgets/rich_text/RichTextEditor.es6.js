import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
const debounce = getModule('debounce');
import { Editor } from 'slate-react';
import { Value, Editor as BasicEditor } from 'slate';
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

import CommandPalette from './CommandPalette/index.es6';
import Toolbar from './Toolbar/index.es6';
import { testForCommands, RICH_TEXT_COMMANDS_CONTEXT_MARK_TYPE } from './CommandPalette/Util.es6';
import { richTextCommandsFeatureFlag } from './CommandPalette/CommandPaletteService.es6';

const createSlateValue = contentfulDocument => {
  const document = toSlatejsDocument({
    document: contentfulDocument,
    schema
  });
  const value = Value.fromJSON({
    document,
    schema
  });
  // Normalize document instead of doing this in the Editor instance as this would
  // trigger unwanted operations that would result in an unwated version bump.
  // TODO: This normalization step wouldn't be necessary if we had a perfect
  // adapter for the version of Slate we are currently using.
  const editor = new BasicEditor({ readOnly: true, value }, { normalize: true });
  const normalizedValue = editor.value;
  return normalizedValue;
};

const emptySlateValue = createSlateValue(emptyDoc);

export default class RichTextEditor extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.shape({
      trackEntryEditorAction: PropTypes.func.isRequired,
      field: PropTypes.shape({
        id: PropTypes.string.isRequired,
        locale: PropTypes.string.isRequired
      }).isRequired,
      permissions: PropTypes.shape({
        canAccessAssets: PropTypes.bool.isRequired
      }).isRequired
    }).isRequired,
    value: PropTypes.object.isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onAction: PropTypes.func,
    isToolbarHidden: PropTypes.bool,
    actionsDisabled: PropTypes.bool,
    scope: PropTypes.object
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
    hasFocus: false,
    currentCommand: '',
    commandPaletteOpen: false,
    commandsEnabled: false
  };

  editor = React.createRef();

  slatePlugins = buildPlugins(
    createRichTextAPI({
      widgetAPI: this.props.widgetAPI,
      onAction: this.props.onAction
    })
  );

  async componentDidMount() {
    const commandsEnabled = await richTextCommandsFeatureFlag.isEnabled();

    this.setState({
      commandsEnabled
    });
  }

  renderCommandMark(props, _, next) {
    if (props.mark.type === RICH_TEXT_COMMANDS_CONTEXT_MARK_TYPE) {
      return (
        <span tabIndex="1" {...props.attributes} className="command-context">
          {props.children}
        </span>
      );
    }

    return next();
  }

  openCommandPanel = command => {
    this.editor.current.setDecorations(command.decorations);
    this.setState({
      currentCommand: command.value,
      currentSelection: command.selection
    });
  };

  onChange = editor => {
    const { value, operations } = editor;
    this.setState(
      {
        value,
        lastOperations: operations.filter(isRelevantOperation)
      },
      () => {
        if (this.state.commandsEnabled) {
          const command = testForCommands(value);
          command && this.openCommandPanel(command);
        }
      }
    );
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.isDisabled !== nextProps.isDisabled) {
      return true;
    }
    const isStateValueUpdate = !is(this.state.value, nextState.value);
    const isPropsValueUpdate = this.props.value !== nextProps.value;
    return isStateValueUpdate || isPropsValueUpdate;
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
              editor={this.editor.current || new BasicEditor({ readOnly: true })}
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
          renderMark={this.renderCommandMark}
          actionsDisabled={this.props.actionsDisabled}
          options={{
            normalize: false // No initial normalizaiton as we pass a normalized document.
          }}
        />
        {this.state.currentCommand && this.state.commandsEnabled && (
          <CommandPalette
            anchor=".command-context"
            value={this.state.value}
            editor={this.editor}
            command={this.state.currentCommand}
            widgetAPI={this.props.widgetAPI}
            selection={this.state.currentSelection}
            onClose={() => {
              this.setState({ currentCommand: null });
            }}
          />
        )}
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
  if (op.type === 'set_value') {
    if (op.properties.data) {
      // Relevant for undo/redo that can be empty ops that we want to ignore.
      return false;
    }
  } else if (op.type === 'set_selection') {
    return false;
  }
  return true;
}
