import React, { Fragment } from 'react';
import { get } from 'lodash';
import mimetype from '@contentful/mimetype';

import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { ActionPerformerName } from 'move-to-core/components/ActionPerformerName';
import Thumbnail from 'components/Thumbnail/Thumbnail';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  margin: css({
    marginRight: tokens.spacingXs,
  }),
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  noWrap: css({
    whiteSpace: 'nowrap',
  }),
};

const getAssetFile = (asset) => {
  return EntityFieldValueSpaceContext.getFieldValue(asset, 'file');
};

const getAssetTitle = (asset) => {
  return EntityFieldValueSpaceContext.assetTitle(asset);
};

const getAssetDimensions = (asset) => {
  const file = getAssetFile(asset);
  if (file) {
    const width = get(file, 'details.image.width', false);
    const height = get(file, 'details.image.height', false);

    if (width !== false && height !== false) {
      return `${width} x ${height} px`;
    }
  }
  return '-'; // default to dash
};

const getAssetFileExtension = (asset) => {
  const file = getAssetFile(asset);
  if (file) {
    const ext = mimetype.getExtension(file.fileName);
    return ext ? ext.slice(1) : '';
  }
};

const getAssetFileType = (asset) => {
  const file = getAssetFile(asset);
  if (file) {
    return mimetype.getGroupName({
      type: file.contentType,
      fallbackFileName: file.fileName,
    });
  }
};

export default function DisplayField({ entity, field }) {
  const { id } = field;

  let result;
  switch (id) {
    case 'file':
      result = <Thumbnail size="30" file={getAssetFile(entity)} />;
      break;
    case 'title': {
      const title = getAssetTitle(entity);
      result = (
        <span className={styles.textOverflow} title={title}>
          {title}
        </span>
      );
      break;
    }
    case 'dimensions': {
      const dimensions = getAssetDimensions(entity);
      result = (
        <span className={styles.textOverflow} title={dimensions}>
          {dimensions}
        </span>
      );
      break;
    }
    case 'fileType':
      result = (
        <Fragment>
          <span className={styles.margin}>{getAssetFileType(entity)}</span>
          <span>{getAssetFileExtension(entity)}</span>
        </Fragment>
      );
      break;
    case 'updatedAt': {
      const updatedAt = entity.getUpdatedAt();
      result = (
        <span className={styles.textOverflow} title={updatedAt}>
          <RelativeDateTime value={updatedAt} />
        </span>
      );
      break;
    }
    case 'updatedBy': {
      result = (
        <span className={styles.textOverflow}>
          <ActionPerformerName link={entity.getUpdatedBy()} />
        </span>
      );
      break;
    }
    default:
      result = <span className={styles.textOverflow}>{toString(entity, field)}</span>;
      break;
  }

  return result || null;
}
