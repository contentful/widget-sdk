'use strict';
angular.module('contentful').
  constant('availableFieldTypes', [
    {
      id: 'shorttext',
      name: 'Short Text',
      description: 'Single field or list. Good for titles, URLs, tags, etc.',
      type: {single: 'Symbol', multiple: 'Array'}
    },
    {
      id: 'longtext',
      name: 'Long Text',
      description: 'Good for long paragraphs',
      type: 'Text'
    },
    {
      id: 'number',
      name: 'Integer',
      description: 'Good for whole numbers',
      type: 'Integer'
    },
    {
      id: 'decimal',
      name: 'Decimal Number',
      description: 'Good for prices, weights, …',
      type: 'Number'
    },
    {
      id: 'calendar',
      name: 'Date & Time',
      description: 'Good for dates or dates and time',
      type: 'Date'
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Good for addresses and coordinates',
      type: 'Location'
    },
    {
      id: 'media',
      name: 'Media',
      description: 'Good for images, videos, PDFs, Word files, etc',
      type: {single: 'Link', multiple: 'Array'},
      linkType: 'Asset'
    },
    {
      id: 'boolean',
      name: 'Boolean',
      description: 'Good for simple Yes/No flags',
      type: 'Boolean'
    },
    {
      id: 'json',
      name: 'JSON Object',
      description: 'Good for JSON snippets',
      type: 'Object'
    },
    {
      id: 'reference',
      name: 'Reference',
      description: 'Link your Content Types',
      type: {single: 'Link', multiple: 'Array'},
      linkType: 'Entry'
    },
]);
