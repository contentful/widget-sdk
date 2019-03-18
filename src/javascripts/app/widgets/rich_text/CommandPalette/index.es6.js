import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { BLOCKS } from '@contentful/rich-text-types';
import isHotKey from 'is-hotkey';
import _ from 'lodash';
import { insertBlock } from '../plugins/EmbeddedEntityBlock/Util.es6';
import { insertInline } from '../plugins/EmbeddedEntryInline/Utils.es6';
import { fetchEntries, fetchContentTypes } from './CommandPaletteService.es6';
import { removeCommand } from './Util.es6';
import CommandPanel from './CommandPanel/index.es6';

const DEFAULT_POSITION = {
  top: -10000,
  left: -10000
};
class CommandPalette extends React.PureComponent {
  static propTypes = {
    anchor: PropTypes.string,
    editor: PropTypes.object,
    value: PropTypes.object,
    command: PropTypes.string,
    selection: PropTypes.object,
    widgetAPI: PropTypes.object,
    onClose: PropTypes.func
  };

  createEntry = (label, contentType, entry, inline) => ({
    label: `${contentType}: ${label}`,
    contentType,
    callback: () => {
      if (inline) {
        insertInline(this.props.editor.current, entry.sys.id);
      } else {
        insertBlock(
          { ...this.props.editor.current, value: this.props.value },
          BLOCKS.EMBEDDED_ENTRY,
          entry
        );
      }

      removeCommand(this.props.editor.current, this.props.selection, this.props.command);
    }
  });

  createContentType = contentType => {
    return [
      {
        label: `Add existing ${contentType.name}`,
        group: contentType.name,
        callback: () => this.createEntries(contentType)
      },
      {
        label: `Add existing ${contentType.name} - Inline`,
        group: contentType.name,
        callback: () => this.createEntries(contentType, true)
      }
    ];
  };

  state = {
    anchorPosition: DEFAULT_POSITION,
    items: [],
    isLoading: true
  };

  handleScroll = e => {
    if (e.target.nodeName !== 'UL') {
      this.updatePanelPosition();
    }
  };

  componentDidMount = () => {
    this.updatePanelPosition();
    this.createContentTypeActions();
    document.addEventListener('scroll', this.handleScroll, true);
    document.addEventListener('keydown', this.handleKeyboard, true);
  };

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll, true);
    document.removeEventListener('keydown', this.handleKeyboard, true);
  }

  createEntries = async (contentType, inline) => {
    this.setState({ isLoading: true });
    const allEntries = await fetchEntries(this.props.widgetAPI, contentType);
    this.setState({
      isLoading: false,
      items: allEntries.map(entry =>
        this.createEntry(entry.displayTitle, entry.contentTypeName, entry.entry, inline)
      )
    });
  };

  createContentTypeActions = async () => {
    const allContentTypes = await fetchContentTypes(this.props.widgetAPI);
    this.setState({
      isLoading: false
    });

    this.setState({
      items: [
        ...this.state.items,
        ...allContentTypes
          .map(contentType => {
            return this.createContentType(contentType);
          })
          .flat()
      ]
    });
  };

  handleKeyboard = e => {
    if (isHotKey('down', e) || isHotKey('up', e) || isHotKey('enter', e)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isHotKey('esc', e)) {
      this.removeCommand();
      this.props.onClose();
    }
  };

  render() {
    const root = window.document.body;
    return ReactDOM.createPortal(
      <div
        tabIndex="1"
        ref={ref => {
          this.palette = ref;
        }}
        style={{
          backgroundColor: '#fff',
          position: 'absolute',
          outline: 'none',
          minWidth: 200,
          top: this.state.anchorPosition.top,
          left: this.state.anchorPosition.left
        }}>
        <CommandPanel
          searchString={this.props.command === '/' ? '' : this.props.command}
          items={this.state.items}
          isLoading={this.state.isLoading}
        />
      </div>,
      root
    );
  }

  updatePanelPosition() {
    this.anchor = window.document.querySelector(this.props.anchor);

    if (!this.anchor) {
      return this.setState({ anchorPosition: DEFAULT_POSITION });
    }

    const anchorRect = this.anchor.getBoundingClientRect();

    this.setState({
      anchorPosition: {
        top: anchorRect.bottom,
        left: anchorRect.left
      }
    });
  }
}

export default CommandPalette;
