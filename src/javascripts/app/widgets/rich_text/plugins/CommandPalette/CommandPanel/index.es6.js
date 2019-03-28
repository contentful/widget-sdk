import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { getModule } from 'NgRegistry.es6';
import isHotKey from 'is-hotkey';
import _ from 'lodash';
import { insertBlock } from 'app/widgets/rich_text/plugins/EmbeddedEntityBlock/Util.es6';
import { insertInline } from 'app/widgets/rich_text/plugins/EmbeddedEntryInline/Utils.es6';
import {
  fetchEntries,
  fetchContentTypes,
  fetchAssets,
  createActionIfAllowed
} from '../CommandPaletteService.es6';
import { removeCommand } from '../Util.es6';
import CommandPanelMenu from './CommandPanelMenu.es6';
import { InViewport } from '@contentful/forma-36-react-components';

const entityCreator = getModule('entityCreator');

const DEFAULT_POSITION = {
  top: 0,
  left: 0
};
class CommandPalette extends React.PureComponent {
  static propTypes = {
    editor: PropTypes.object,
    widgetAPI: PropTypes.object,
    onClose: PropTypes.func,
    command: PropTypes.string
  };

  state = {
    anchorPosition: DEFAULT_POSITION,
    items: [],
    isLoading: true,
    panelPosition: 'bottom'
  };

  paletteDimensions = {
    height: 300,
    width: 300
  };

  componentDidMount = async () => {
    this.createInitialCommands();
    this.updatePanelPosition();
    this.paletteDimensions = {
      height: this.palette.getBoundingClientRect().height,
      width: this.palette.getBoundingClientRect().width
    };
    this.bindEventListeners();
  };

  componentWillUnmount() {
    this.removeEventListeners();
  }

  bindEventListeners = () => {
    document.addEventListener('scroll', this.handleScroll, true);
    document.addEventListener('keydown', this.handleKeyboard, true);
    document.addEventListener('mousedown', this.handleOutsideClick, true);
  };

  removeEventListeners = () => {
    document.removeEventListener('scroll', this.handleScroll, true);
    document.removeEventListener('keydown', this.handleKeyboard, true);
    document.removeEventListener('mousedown', this.handleOutsideClick, true);
  };

  handleOutsideClick = event => {
    if (!this.palette.contains(event.target)) {
      this.setState({
        isClosed: true
      });
    }
  };

  requestUpdate = _.throttle(
    () => {
      this.setState({ isUpdating: true });
      this.createCommands(
        this.state.currentCommand.contentType,
        this.state.currentCommand.type,
        this.props.command
      );
    },
    1000,
    { leading: false, trailing: true }
  );

  componentDidUpdate() {
    if (this.state.currentCommand && this.state.currentCommand.command !== this.props.command) {
      this.requestUpdate();
    } else {
      this.requestUpdate.cancel();
    }
    if (!this.state.isClosed) {
      this.bindEventListeners();
    } else {
      this.removeEventListeners();
    }
  }

  createCommand = (label, contentType, entry, type) => ({
    label: `${label}`,
    contentType,
    callback: () => {
      removeCommand(this.props.editor, this.props.command);
      switch (type) {
        case INLINES.EMBEDDED_ENTRY:
          insertInline(this.props.editor, entry.sys.id, false);
          break;
        case BLOCKS.EMBEDDED_ASSET:
          insertBlock(this.props.editor, BLOCKS.EMBEDDED_ASSET, entry, false);
          break;
        default:
          insertBlock(this.props.editor, BLOCKS.EMBEDDED_ENTRY, entry, false);
          break;
      }
    }
  });

  onCreateAndEmbedEntry = async (contentTypeId, inline) => {
    removeCommand(this.props.editor, this.props.command);
    const createEntity = () =>
      contentTypeId !== null ? entityCreator.newEntry(contentTypeId) : entityCreator.newAsset();
    const entity = await createEntity();
    const { id: entityId, type: entityType } = entity.data.sys;

    inline
      ? insertInline(this.props.editor, entity.data.sys.id, false)
      : insertBlock(
          this.props.editor,
          contentTypeId ? BLOCKS.EMBEDDED_ENTRY : BLOCKS.EMBEDDED_ASSET,
          entity.data
        );

    this.props.widgetAPI.navigator.openEntity(entityType, entityId, { slideIn: true });
  };

  createContentTypeActions = (field, contentType) =>
    [
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ENTRY, false, () => {
        this.setState({ breadcrumb: contentType.name, isLoading: true });
        this.clearCommand();
        this.createCommands(contentType);
      }),
      createActionIfAllowed(field, contentType, INLINES.EMBEDDED_ENTRY, false, () => {
        this.setState({ breadcrumb: contentType.name, isLoading: true });
        this.clearCommand();
        this.createCommands(contentType, INLINES.EMBEDDED_ENTRY);
      }),
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ENTRY, true, () =>
        this.onCreateAndEmbedEntry(contentType.sys.id)
      ),
      createActionIfAllowed(field, contentType, INLINES.EMBEDDED_ENTRY, true, () =>
        this.onCreateAndEmbedEntry(contentType.sys.id, true)
      )
    ].filter(action => action);

  createAssetActions = (field, contentType) =>
    [
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ASSET, false, () => {
        this.setState({ breadcrumb: 'Asset', isLoading: true });
        this.clearCommand();
        this.createCommands(null, BLOCKS.EMBEDDED_ASSET);
      }),
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ASSET, true, () =>
        this.onCreateAndEmbedEntry(null)
      )
    ].filter(action => action);

  handleScroll = e => {
    if (e.target.nodeName !== 'UL') {
      this.updatePanelPosition();
    }
  };

  clearCommand = () => {
    if (this.props.command !== '/') {
      removeCommand(this.props.editor, this.props.command, 0);
    }
  };

  createCommands = async (contentType, type, command) => {
    this.setState({ isUpdating: true });
    const allEntries = !contentType
      ? await fetchAssets(this.props.widgetAPI)
      : await fetchEntries(this.props.widgetAPI, contentType, command);
    this.setState({
      currentCommand: {
        contentType,
        type,
        command
      },
      isUpdating: false,
      isLoading: false,
      items: allEntries.map(entry =>
        this.createCommand(entry.displayTitle, entry.contentTypeName, entry.entry, type)
      )
    });
  };

  createInitialCommands = async () => {
    const { widgetAPI } = this.props;
    const allContentTypes = await fetchContentTypes(widgetAPI);
    this.setState({
      isLoading: false
    });

    this.setState({
      items: [
        ...this.state.items,
        ...allContentTypes
          .map(contentType => {
            return this.createContentTypeActions(widgetAPI.field, contentType);
          })
          .reduce((pre, cur) => [...cur, ...pre]),
        ...this.createAssetActions(widgetAPI.field)
      ]
    });
  };

  handleKeyboard = e => {
    if (isHotKey('down', e) || isHotKey('up', e) || isHotKey('enter', e)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isHotKey('esc', e)) {
      this.setState({
        isClosed: true
      });
    }
  };

  render() {
    if (this.state.isClosed) {
      return null;
    }
    const root = window.document.body;
    return ReactDOM.createPortal(
      <div
        tabIndex="1"
        ref={ref => {
          this.palette = ref;
        }}
        style={{
          position: 'absolute',
          outline: 'none',
          minWidth: 200,
          top: this.state.anchorPosition.top,
          left: this.state.anchorPosition.left
        }}>
        <InViewport
          onOverflowBottom={() => {
            this.setState({ panelPosition: 'top' }, this.updatePanelPosition);
          }}
          onOverflowTop={() => {
            this.setState({ panelPosition: 'bottom' }, this.updatePanelPosition);
          }}>
          <CommandPanelMenu
            searchString={this.props.command === '/' ? '' : this.props.command}
            items={this.state.items}
            isLoading={this.state.isLoading}
            isUpdating={this.state.isUpdating}
            breadcrumb={this.state.breadcrumb}
          />
        </InViewport>
      </div>,
      root
    );
  }

  updatePanelPosition() {
    const anchorRect = document
      .getSelection()
      .getRangeAt(0)
      .getBoundingClientRect();

    const anchorPosition =
      this.state.panelPosition === 'bottom'
        ? {
            top: anchorRect.bottom,
            left: anchorRect.left
          }
        : { top: anchorRect.top - this.paletteDimensions.height, left: anchorRect.left };

    this.setState({
      anchorPosition
    });
  }
}

export default CommandPalette;
