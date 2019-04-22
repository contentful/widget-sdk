import React from 'react';
import PropTypes from 'prop-types';
import { AssetCard } from '@contentful/forma-36-react-components';
import { AssetActions } from './CardActions.es6';
import mimetype from '@contentful/mimetype';

export default class WrappedAssetCard extends React.Component {
  static propTypes = {
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    isLoading: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    className: ''
  };

  getFileType(file) {
    if (!file) {
      return;
    }

    const groupToIconMap = {
      image: 'image',
      video: 'video',
      audio: 'audio',
      richtext: 'richtext',
      presentation: 'presentation',
      spreadsheet: 'spreadsheet',
      pdfdocument: 'pdf',
      archive: 'archive',
      plaintext: 'plaintext',
      code: 'code',
      markup: 'markup'
    };

    const groupName = mimetype.getGroupLabel({
      type: file.contentType,
      fallbackFileName: file.fileName
    });

    if (groupName in groupToIconMap) {
      return groupToIconMap[groupName];
    } else {
      return 'archive';
    }
  }

  renderAssetActions(entityFile) {
    const { readOnly, disabled, onEdit, onRemove } = this.props;
    if (readOnly) {
      return null;
    }
    // Can't just use jsx <AssetActions /> here as dropdownListElements expects
    // a React.Fragement with <DropdownList /> inside.
    return new AssetActions({
      entityFile,
      isDisabled: disabled,
      onEdit,
      onRemove
    }).render();
  }

  render() {
    const {
      entityFile,
      entityTitle,
      className,
      selected,
      entityStatus,
      isLoading,
      onClick
    } = this.props;

    return (
      <AssetCard
        type={entityFile ? this.getFileType(entityFile) : 'archive'} // Default to archive if file doesn't exist
        title={entityTitle || 'Untitled'}
        className={className}
        selected={selected}
        status={entityStatus}
        src={entityFile ? `${entityFile.url}?h=${300}` : ''}
        isLoading={isLoading}
        onClick={onClick}
        dropdownListElements={this.renderAssetActions(entityFile)}
      />
    );
  }
}
