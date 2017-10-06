import { map } from 'lodash';
import random from 'random';
import mimetype from 'mimetype';
import systemFields from 'systemFields';

/**
 * This modules exports functions that generate default payoads for the
 * UiConfig.
 */

export function getEntryViews (contentTypes) {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [{
        id: random.id(),
        title: 'All',
        order: systemFields.getDefaultOrder(),
        displayedFieldIds: systemFields.getDefaultFieldIds()
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
    title,
    searchTerm,
    id: random.id(),
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  };
}

function contentTypeViews (contentTypes) {
  return map(contentTypes, createContentTypeView);
}

export function createContentTypeView ({data}) {
  return {
    title: data.name,
    contentTypeId: data.sys.id,
    id: random.id(),
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  };
}

function fileTypeViews () {
  return map(mimetype.getGroupNames(), (title, label) => {
    return {
      title,
      searchTerm: `type:${label}`,
      id: random.id()
    };
  });
}

export function getPrivateViews ({user}) {
  // TODO search terms produced this way won't work if first/last name
  // combination is not unique in a space. It cannot be easily solved w/o
  // fetching all the users. Storing search criteria in a data structure (e.g.
  // ID of a user) instead of search string should help.
  const name = `${user.firstName} ${user.lastName}`.replace('"', '');

  return [
    {
      id: 'default',
      title: 'My views',
      views: [
        {id: random.id(), title: 'Created by me', searchTerm: `author : "${name}"`},
        {id: random.id(), title: 'Updated by me', searchTerm: `updater : "${name}"`}
      ]
    }
  ];
}
