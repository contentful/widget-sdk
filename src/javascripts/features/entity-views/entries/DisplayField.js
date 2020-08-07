import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cn from 'classnames';
import moment from 'moment';

import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import Thumbnail from 'components/Thumbnail/Thumbnail';

import { Pill, SkeletonText } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { css } from 'emotion';
import { truncate } from 'utils/StringUtils';
import { useReadTags } from 'features/content-tags';
import { METADATA_TAGS_ID } from 'data/MetadataFields';

const styles = {
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  noWrap: css({
    whiteSpace: 'nowrap',
  }),
  tag: css({
    marginRight: tokens.spacing2Xs,
    marginBottom: tokens.spacing2Xs,
    userSelect: 'none',
  }),
};

const displayType = (field) => {
  if (
    field.type === 'Date' &&
    (field.id === 'updatedAt' || field.id === 'createdAt' || field.id === 'publishedAt')
  ) {
    return field.id;
  }

  if (field.type === 'Symbol' && field.id === 'author') {
    return 'author';
  }

  if (field.type === 'Symbol' && field.id === METADATA_TAGS_ID) {
    return 'tags';
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
  return _.filter(items, (item) => {
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

const displayBool = (value) => (value ? 'Yes' : 'No');

const displayLocation = (value) =>
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
    return filterVisibleItems(items, entryCache, assetCache).map((entryLink) =>
      dataForEntry(entryLink, entryCache)
    );
  }

  if (hasItemsOfType(items, 'Asset')) {
    return filterVisibleItems(items, entryCache, assetCache).map((assetLink) =>
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
  value: PropTypes.string.isRequired,
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
  value: PropTypes.string.isRequired,
};

function addGetTagsMethodToEntity(entity, getTag) {
  entity.getTags = () => entity.data.metadata?.tags?.map((tag) => getTag(tag.sys.id));
  return entity;
}

export function DisplayField({ entity, field, entryCache, assetCache }) {
  let result;
  switch (displayType(field)) {
    case 'updatedAt':
      result = entity.getUpdatedAt() && <RelativeDateFieldValue value={entity.getUpdatedAt()} />;
      break;
    case 'createdAt':
      result = entity.getCreatedAt() && <RelativeDateFieldValue value={entity.getCreatedAt()} />;
      break;
    case 'publishedAt':
      result = entity.getPublishedAt() && (
        <RelativeDateFieldValue value={entity.getPublishedAt()} />
      );
      break;
    case 'Date': {
      const value = dataForField(entity, field);
      result = value && <AbsoluteDateFieldValue value={value} />;
      break;
    }
    case 'ContentType': {
      const contentTypeId = entity.getContentTypeId();
      const contentType = EntityFieldValueSpaceContext.getContentTypeById(contentTypeId);
      if (contentType) {
        result = <span className={styles.textOverflow}>{contentType.getName()}</span>;
      }
      break;
    }
    case 'author':
      result = <ActionPerformerName link={entity.getUpdatedBy()} />;
      break;
    case 'tags': {
      const tagsList = entity.getTags() || [];
      result = (
        <span>
          {tagsList?.map((tag, index) => {
            if (tag) {
              return <Pill className={css(styles.tag, {})} key={tag.sys.id} label={tag.name} />;
            } else {
              return <SkeletonText numberOfLines={1} key={`skeleton-text-${index}`} />;
            }
          })}
        </span>
      );
      break;
    }
    case 'Boolean':
      result = <span>{displayBool(dataForField(entity, field))}</span>;
      break;
    case 'Location':
      result = <span>{displayLocation(dataForField(entity, field))}</span>;
      break;
    case 'Entry':
      result = (
        <span className={cn('linked-entries', styles.textOverflow)}>
          {dataForLinkedEntry(entity, field, entryCache)}
        </span>
      );
      break;
    case 'EntryTitle': {
      let title = EntityFieldValueSpaceContext.entryTitle(entity);
      const length = 130;
      if (title.length > length) {
        title = truncate(title, length);
      }
      result = <span>{title}</span>;
      break;
    }
    case 'Asset':
      result = (
        <div className="file-preview linked-assets">
          <Thumbnail
            file={dataForLinkedAsset(entity, field, assetCache)}
            size="30"
            fit="thumb"
            focus="faces"
          />
        </div>
      );
      break;
    case 'Array': {
      const isEntries = isEntryArray(entity, field);
      const isAssets = isAssetArray(entity, field);
      result = (
        <ul
          className={cn(styles.textOverflow, {
            'linked-entries': isEntries,
            'linked-assets': isAssets,
          })}>
          {!isEntries && !isAssets ? (
            <li>
              <span className={styles.textOverflow}>
                {JSON.stringify(dataForField(entity, field))}
              </span>
            </li>
          ) : (
            dataForArray(entity, field, entryCache, assetCache).map((item, index) => {
              if (isEntries) {
                return (
                  <li key={index}>
                    <span className={styles.textOverflow}>{item}</span>
                  </li>
                );
              } else if (isAssets && typeof item !== 'string') {
                return (
                  <li key={index}>
                    <div className="file-preview">
                      <Thumbnail file={item} size="30" fit="thumb" focus="faces" />
                    </div>
                  </li>
                );
              }
            })
          )}
        </ul>
      );
      break;
    }
    default:
      result = <span className={styles.textOverflow}>{toString(entity, field)}</span>;
      break;
  }

  return result || null;
}

export const DisplayFieldWithTagsEnabled = ({ entity, field, entryCache, assetCache }) => {
  const { getTag } = useReadTags();

  entity = addGetTagsMethodToEntity(entity, getTag);
  return (
    <DisplayField entity={entity} field={field} entryCache={entryCache} assetCache={assetCache} />
  );
};

DisplayFieldWithTagsEnabled.propTypes = {
  entity: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
  entryCache: PropTypes.object,
  assetCache: PropTypes.object,
};
