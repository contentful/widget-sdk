import React from 'react';
import PropTypes from 'prop-types';
import { AssetCard, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import { get } from 'lodash';
import mimetype from '@contentful/mimetype';

import { shortenStorageUnit } from 'utils/NumberUtils.es6';

class WrappedAssetCard extends React.Component {
  static propTypes = {
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    isLoading: PropTypes.bool,
    extraClassNames: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func
  };

  static defaultProps = {
    extraClassNames: ''
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

  downloadAsset(url) {
    window.open(url, '_blank');
  }

  renderAssetActions(entityFile) {
    return (
      <React.Fragment>
        <DropdownList style={{ maxWidth: '300px' }}>
          <DropdownListItem isTitle>Actions</DropdownListItem>
          {this.props.onEdit && (
            <DropdownListItem
              onClick={event => {
                event.stopPropagation();
                this.props.onEdit();
              }}>
              Edit
            </DropdownListItem>
          )}

          {entityFile && (
            <DropdownListItem onClick={() => this.downloadAsset(entityFile.url)}>
              Download
            </DropdownListItem>
          )}

          {this.props.onRemove && (
            <DropdownListItem
              onClick={event => {
                event.stopPropagation();
                this.props.onRemove();
              }}>
              Remove
            </DropdownListItem>
          )}
        </DropdownList>
        <DropdownList border="top" style={{ maxWidth: '300px' }}>
          <DropdownListItem isTitle>File info</DropdownListItem>
          {get(entityFile, 'fileName') && (
            <DropdownListItem>
              <div className="u-truncate">{entityFile.fileName}</div>
            </DropdownListItem>
          )}
          {get(entityFile, 'contentType') && (
            <DropdownListItem>
              <div className="u-truncate">{entityFile.contentType}</div>
            </DropdownListItem>
          )}
          {get(entityFile, 'details.size') && (
            <DropdownListItem>{shortenStorageUnit(entityFile.details.size, 'B')}</DropdownListItem>
          )}
          {get(entityFile, 'details.image') && (
            <DropdownListItem>{`${entityFile && entityFile.details.image.width} × ${entityFile &&
              entityFile.details.image.height}`}</DropdownListItem>
          )}
        </DropdownList>
      </React.Fragment>
    );
  }

  render() {
    const {
      entityFile,
      entityTitle,
      extraClassNames,
      selected,
      entityStatus,
      isLoading
    } = this.props;

    return (
      <AssetCard
        height={300}
        type={entityFile ? this.getFileType(entityFile) : 'archive'} // Default to archive if file doesn't exist
        title={entityTitle || 'Untitled'}
        extraClassNames={extraClassNames}
        selected={selected}
        status={entityStatus}
        src={entityFile && entityFile.url}
        isLoading={isLoading}
        dropdownListElements={this.renderAssetActions(entityFile)}
      />
    );
  }
}

export default WrappedAssetCard;
