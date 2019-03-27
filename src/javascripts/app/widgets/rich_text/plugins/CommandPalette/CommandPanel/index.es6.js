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
    isLoading: true
  };

  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.createInitialCommands();
    this.updatePanelPosition();
    document.addEventListener('scroll', this.handleScroll, true);
    document.addEventListener('keydown', this.handleKeyboard, true);
  };

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll, true);
    document.removeEventListener('keydown', this.handleKeyboard, true);
  }

  createCommand = (label, contentType, entry, type) => ({
    label: `${label}`,
    contentType,
    callback: () => {
      removeCommand(this.props.editor, this.props.command);
      switch (type) {
        case 'inline':
          insertInline(this.props.editor, entry.sys.id, false);
          break;
        case 'asset':
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
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ENTRY, false, () =>
        this.createCommands(contentType)
      ),
      createActionIfAllowed(field, contentType, INLINES.EMBEDDED_ENTRY, false, () =>
        this.createCommands(contentType, 'inline')
      ),
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ENTRY, true, () =>
        this.onCreateAndEmbedEntry(contentType.sys.id, true)
      ),
      createActionIfAllowed(field, contentType, INLINES.EMBEDDED_ENTRY, true, () =>
        this.onCreateAndEmbedEntry(contentType.sys.id, true)
      )
    ].filter(action => action);

  createAssetActions = (field, contentType) =>
    [
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ASSET, true, () =>
        this.onCreateAndEmbedEntry(null)
      ),
      createActionIfAllowed(field, contentType, BLOCKS.EMBEDDED_ASSET, false, () =>
        this.createAssetEntityCommands()
      )
    ].filter(action => action);

  handleScroll = e => {
    if (e.target.nodeName !== 'UL') {
      this.updatePanelPosition();
    }
  };

  createCommands = async (contentType, type) => {
    this.setState({ isLoading: true });
    const allEntries = await fetchEntries(this.props.widgetAPI, contentType);
    this.setState({
      isLoading: false,
      items: allEntries.map(entry =>
        this.createCommand(entry.displayTitle, entry.contentTypeName, entry.entry, type)
      )
    });
  };

  createAssetEntityCommands = async () => {
    this.setState({ isLoading: true });
    const allAssets = await fetchAssets(this.props.widgetAPI);
    this.setState({
      isLoading: false,
      items: allAssets.map(entry =>
        this.createCommand(entry.displayTitle, entry.contentTypeName, entry.entry, 'asset')
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
        <CommandPanelMenu
          searchString={this.props.command === '/' ? '' : this.props.command}
          items={this.state.items}
          isLoading={this.state.isLoading}
        />
      </div>,
      root
    );
  }

  updatePanelPosition() {
    const anchorRect = document
      .getSelection()
      .getRangeAt(0)
      .getBoundingClientRect();

    this.setState({
      anchorPosition: {
        top: anchorRect.bottom,
        left: anchorRect.left
      }
    });
  }
}

export default CommandPalette;
