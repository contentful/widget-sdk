import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cn from 'classnames';
import moment from 'moment';

import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import UserNameFormatter from 'components/shared/UserNameFormatter/FetchAndFormatUserName';
import Thumbnail from 'components/Thumbnail/Thumbnail';

import { css } from 'emotion';

const styles = {
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }),
  noWrap: css({
    whiteSpace: 'nowrap'
  })
};

const displayType = field => {
  if (
    field.type === 'Date' &&
    (field.id === 'updatedAt' || field.id === 'createdAt' || field.id === 'publishedAt')
  ) {
    return field.id;
  }

  if (field.type === 'Symbol' && field.id === 'author') {
    return 'author';
  }

  if (field.type === 'Link') {
    return field.linkType;
  }

  return field.type;
};

const dataForField = (entry, field) => {
  return EntityFieldValueSpaceContext.getFieldValue(entry, field.id);
};

function filterVisibleItems(items, entryCache, assetCache) {
  let counter = 0;
  const cacheName = hasItemsOfType(items, 'Entry') ? entryCache : assetCache;
  const limit = cacheName.params.limit;
  return _.filter(items, item => {
    const hasItem = cacheName.has(item.sys.id);
    if (hasItem && counter < limit) {
      counter++;
      return true;
    }
    return false;
  });
}

/**
 * If the field value is an entry link, return its title.
 *
 * If the link points to a missing entry, return "missing".
 */
const dataForEntry = (entryLink, entryCache) => {
  const entry = entryCache.get(entryLink.sys.id);
  if (entry) {
    return EntityFieldValueSpaceContext.entryTitle(entry);
  } else {
    return 'missing';
  }
};

const dataForAsset = (assetLink, assetCache) => {
  const asset = assetCache.get(assetLink.sys.id);
  return EntityFieldValueSpaceContext.getFieldValue(asset, 'file');
};

const dataForLinkedEntry = (entry, field, entryCache) => {
  const entryLinkField = EntityFieldValueSpaceContext.getFieldValue(entry, field.id);
  return entryLinkField ? dataForEntry(entryLinkField, entryCache) : '';
};

const dataForLinkedAsset = (entry, field, assetCache) => {
  const assetLinkField = EntityFieldValueSpaceContext.getFieldValue(entry, field.id);
  return assetLinkField ? dataForAsset(assetLinkField, assetCache) : '';
};

const displayBool = value => (value ? 'Yes' : 'No');

const displayLocation = value =>
  value ? parseLocation(value.lat) + ', ' + parseLocation(value.lon) : '';

function parseLocation(val) {
  return _.isNumber(val) ? val.toFixed(4) : 'Invalid value';
}

function hasItemsOfType(items, type) {
  return _.get(items, ['0', 'sys', 'linkType']) === type;
}

const isEntryArray = (entity, field) => {
  const items = dataForField(entity, field);
  return hasItemsOfType(items, 'Entry');
};

const isAssetArray = (entity, field) => {
  const items = dataForField(entity, field);
  return hasItemsOfType(items, 'Asset');
};

const dataForArray = (entry, field, entryCache, assetCache) => {
  const items = dataForField(entry, field);
  if (hasItemsOfType(items, 'Entry')) {
    return filterVisibleItems(items, entryCache, assetCache).map(entryLink =>
      dataForEntry(entryLink, entryCache)
    );
  }

  if (hasItemsOfType(items, 'Asset')) {
    return filterVisibleItems(items, entryCache, assetCache).map(assetLink =>
      dataForAsset(assetLink, assetCache)
    );
  }

  return [];
};

const toString = (entry, field) => {
  const result = dataForField(entry, field);

  if (_.isObject(result) || _.isArray(result)) {
    return JSON.stringify(result);
  }
  return result;
};

function RelativeDateFieldValue({ value }) {
  return (
    <span className={styles.textOverflow}>
      <RelativeDateTime value={value} />
    </span>
  );
}

RelativeDateFieldValue.propTypes = {
  value: PropTypes.string.isRequired
};

function AbsoluteDateFieldValue({ value }) {
  const label = moment.parseZone(value).format('MM/DD/YYYY h:mm A Z');

  return (
    <span className={styles.textOverflow} title={label}>
      {label}
    </span>
  );
}

AbsoluteDateFieldValue.propTypes = {
  value: PropTypes.string.isRequired
};

export default function DisplayField({ entry, field, entryCache, assetCache }) {
  let result;
  switch (displayType(field)) {
    case 'updatedAt':
      result = entry.getUpdatedAt() && <RelativeDateFieldValue value={entry.getUpdatedAt()} />;
      break;
    case 'createdAt':
      result = entry.getCreatedAt() && <RelativeDateFieldValue value={entry.getCreatedAt()} />;
      break;
    case 'publishedAt':
      result = entry.getPublishedAt() && <RelativeDateFieldValue value={entry.getPublishedAt()} />;
      break;
    case 'Date': {
      const value = dataForField(entry, field);
      result = value && <AbsoluteDateFieldValue value={value} />;
      break;
    }
    case 'author':
      result = <UserNameFormatter userId={entry.getUpdatedBy().sys.id} />;
      break;
    case 'Boolean':
      result = <span>{displayBool(dataForField(entry, field))}</span>;
      break;
    case 'Location':
      result = <span>{displayLocation(dataForField(entry, field))}</span>;
      break;
    case 'Entry':
      result = (
        <span className={cn('linked-entries', styles.textOverflow)}>
          {dataForLinkedEntry(entry, field, entryCache)}
        </span>
      );
      break;
    case 'Asset':
      result = (
        <div className="file-preview linked-assets">
          <Thumbnail
            file={dataForLinkedAsset(entry, field, assetCache)}
            size="30"
            fit="thumb"
            focus="faces"
          />
        </div>
      );
      break;
    case 'Array':
      result = (
        <ul
          className={cn(styles.textOverflow, {
            'linked-entries': isEntryArray(entry, field),
            'linked-assets': isAssetArray(entry, field)
          })}>
          {!isEntryArray(entry, field) && !isAssetArray(entry, field) ? (
            <li>
              <span className={styles.textOverflow}>
                {JSON.stringify(dataForField(entry, field))}
              </span>
            </li>
          ) : (
            dataForArray(entry, field, entryCache, assetCache).map((entity, index) => {
              if (isEntryArray(entry, field)) {
                return (
                  <li key={index}>
                    <span className={styles.textOverflow}>{entity}</span>
                  </li>
                );
              } else if (isAssetArray(entry, field)) {
                return (
                  <li key={index}>
                    <div className="file-preview">
                      <Thumbnail file={entity} size="30" fit="thumb" focus="faces" />
                    </div>
                  </li>
                );
              }
            })
          )}
        </ul>
      );
      break;

    default:
      result = <span className={styles.textOverflow}>{toString(entry, field)}</span>;
      break;
  }

  return result || null;
}
