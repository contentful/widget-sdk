import React from 'react';
import _ from 'lodash';
import cn from 'classnames';

import AngularComponent from 'ui/Framework/AngularComponent.es6';

import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';
import UserNameFormatter from 'components/shared/UserNameFormatter/FetchAndFormatUserName.es6';

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

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

const dataForField = (entry, field) => spaceContext.getFieldValue(entry, field.id);

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
    return spaceContext.entryTitle(entry);
  } else {
    return 'missing';
  }
};

const dataForAsset = (assetLink, assetCache) => {
  const asset = assetCache.get(assetLink.sys.id);
  return spaceContext.getFieldValue(asset, 'file');
};

const dataForLinkedEntry = (entry, field, entryCache) => {
  const entryLinkField = spaceContext.getFieldValue(entry, field.id);
  return entryLinkField ? dataForEntry(entryLinkField, entryCache) : '';
};

const dataForLinkedAsset = (entry, field, assetCache) => {
  const assetLinkField = spaceContext.getFieldValue(entry, field.id);
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

export default function DisplayField({ entry, field, entryCache, assetCache }) {
  let result;
  switch (displayType(field)) {
    case 'updatedAt':
      result = entry.getUpdatedAt() && <RelativeDateTime value={entry.getUpdatedAt()} />;
      break;
    case 'createdAt':
      result = entry.getCreatedAt() && <RelativeDateTime value={entry.getCreatedAt()} />;
      break;
    case 'publishedAt':
      result = entry.getPublishedAt() && <RelativeDateTime value={entry.getPublishedAt()} />;
      break;
    case 'Date':
      result = dataForField(entry, field) && (
        <RelativeDateTime value={dataForField(entry, field)} />
      );
      break;
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
        <span className="linked-entries">{dataForLinkedEntry(entry, field, entryCache)}</span>
      );
      break;
    case 'Asset':
      result = (
        <div className="file-preview linked-assets">
          <AngularComponent
            template={'<cf-thumbnail file="file" size="30" fit="thumb" focus="faces" />'}
            scope={{ file: dataForLinkedAsset(entry, field, assetCache) }}
          />
        </div>
      );
      break;
    case 'Array':
      result = (
        <ul
          className={cn({
            'linked-entries': isEntryArray(entry, field),
            'linked-assets': isAssetArray(entry, field)
          })}>
          {!isEntryArray(entry, field) && !isAssetArray(entry, field) ? (
            <li>{JSON.stringify(dataForField(entry, field))}</li>
          ) : (
            dataForArray(entry, field, entryCache, assetCache).map((entity, index) => {
              if (isEntryArray(entry, field)) {
                return (
                  <li key={index}>
                    <span>{entity}</span>
                  </li>
                );
              } else if (isAssetArray(entry, field)) {
                return (
                  <li key={index}>
                    <div className="file-preview">
                      <AngularComponent
                        template={
                          '<cf-thumbnail file="file" size="30" fit="thumb" focus="faces" />'
                        }
                        scope={{ file: entity }}
                      />
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
      result = <span>{toString(entry, field)}</span>;
      break;
  }

  return result || null;
}
