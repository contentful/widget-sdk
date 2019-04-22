import React from 'react';
import PropTypes from 'prop-types';
import { DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';

import { get } from 'lodash';
import { shortenStorageUnit } from 'utils/NumberUtils.es6';

const commonPropTypes = {
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  isDisabled: PropTypes.bool
};

export class EntryActions extends React.Component {
  static propTypes = {
    ...commonPropTypes
  };

  render() {
    const { isDisabled, onEdit, onRemove } = this.props;
    return (
      <DropdownList>
        {onEdit && (
          <DropdownListItem
            onClick={() => {
              onEdit();
            }}
            testId="edit">
            Edit
          </DropdownListItem>
        )}
        {onRemove && (
          <DropdownListItem
            onClick={() => {
              onRemove();
            }}
            disabled={isDisabled}
            testId="delete">
            Remove
          </DropdownListItem>
        )}
      </DropdownList>
    );
  }
}

export class AssetActions extends React.Component {
  static propTypes = {
    entityFile: PropTypes.object,
    ...commonPropTypes
  };

  renderActions() {
    const { entityFile, isDisabled, onEdit, onRemove } = this.props;
    return (
      <DropdownList style={{ maxWidth: '300px' }}>
        <DropdownListItem isTitle>Actions</DropdownListItem>
        {onEdit && (
          <DropdownListItem
            onClick={() => {
              onEdit();
            }}>
            Edit
          </DropdownListItem>
        )}
        {entityFile && (
          <DropdownListItem
            onClick={() => {
              downloadAsset(entityFile.url);
            }}>
            Download
          </DropdownListItem>
        )}
        {onRemove && (
          <DropdownListItem
            isDisabled={isDisabled}
            onClick={() => {
              onRemove();
            }}>
            Remove
          </DropdownListItem>
        )}
      </DropdownList>
    );
  }

  renderAssetInfo() {
    const { entityFile } = this.props;
    const fileName = get(entityFile, 'fileName');
    const mimeType = get(entityFile, 'contentType');
    const fileSize = get(entityFile, 'details.size');
    const image = get(entityFile, 'details.image');
    return (
      <DropdownList border="top" style={{ maxWidth: '300px' }}>
        <DropdownListItem isTitle>File info</DropdownListItem>
        {fileName && (
          <DropdownListItem>
            <div className="u-truncate">{fileName}</div>
          </DropdownListItem>
        )}
        {mimeType && (
          <DropdownListItem>
            <div className="u-truncate">{mimeType}</div>
          </DropdownListItem>
        )}
        {fileSize && <DropdownListItem>{shortenStorageUnit(fileSize, 'B')}</DropdownListItem>}
        {image && <DropdownListItem>{`${image.width} × ${image.height}`}</DropdownListItem>}
      </DropdownList>
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderActions()}
        {this.renderAssetInfo()}
      </React.Fragment>
    );
  }
}

function downloadAsset(url) {
  window.open(url, '_blank');
}
