import { map } from 'lodash';
import random from 'random';
import mimetype from 'mimetype';
import systemFields from 'systemFields';

/**
 * This modules exports functions that generate default payoads for the
 * UiConfig.
 */

const defaultOrder = systemFields.getDefaultOrder();

const DEFAULT_FIELD_IDS = map(systemFields.getDefaultFields(), 'id');

export function getEntryViews (contentTypes) {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [{
        id: random.id(),
        title: 'All',
        order: defaultOrder,
        displayedFieldIds: DEFAULT_FIELD_IDS
      }]
    },
    {
      id: random.id(),
      title: 'Status',
      views: [
        createEntryStatusView('Published', 'status:published'),
        createEntryStatusView('Changed', 'status:changed'),
        createEntryStatusView('Draft', 'status:draft'),
        createEntryStatusView('Archived', 'status:archived')
      ]
    },
    {
      id: random.id(),
      title: 'Content Type',
      views: contentTypeViews(contentTypes)
    }
  ];
}

export function getAssetViews () {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [{
        id: random.id(),
        title: 'All'
      }]
    },
    {
      id: random.id(),
      title: 'Status',
      views: [
        {title: 'Published', searchTerm: 'status:published', id: random.id()},
        {title: 'Changed', searchTerm: 'status:changed', id: random.id()},
        {title: 'Draft', searchTerm: 'status:draft', id: random.id()},
        {title: 'Archived', searchTerm: 'status:archived', id: random.id()}
      ]
    },
    {
      id: random.id(),
      title: 'File Type',
      views: fileTypeViews()
    }
  ];
}

function createEntryStatusView (title, searchTerm) {
  return {
    title: title,
    searchTerm: searchTerm,
    id: random.id(),
    order: defaultOrder,
    displayedFieldIds: DEFAULT_FIELD_IDS
  };
}

function contentTypeViews (contentTypes) {
  return map(contentTypes, function (contentType) {
    return createContentTypeView(contentType);
  });
}

export function createContentTypeView (contentType) {
  return {
    title: contentType.data.name,
    contentTypeId: contentType.getId(),
    id: random.id(),
    order: defaultOrder,
    displayedFieldIds: DEFAULT_FIELD_IDS
  };
}

function fileTypeViews () {
  return map(mimetype.getGroupNames(), function (name, label) {
    return {
      title: name,
      searchTerm: 'type:' + label,
      id: random.id()
    };
  });
}
