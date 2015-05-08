'use strict';
angular.module('contentful').
  constant('availableFieldTypes', [
    {
      name: 'Short Text',
      description: 'Single field or list. Good for titles, URLs, tags, etc.',
      type: {single: 'Symbol', multiple: 'Array'}
    },
    {
      name: 'Long Text',
      description: 'Good for long paragraphs',
      type: 'Text'
    },
    {
      name: 'Integer',
      description: 'Good for whole numbers',
      type: 'Integer'
    },
    {
      name: 'Decimal Number',
      description: 'Good for prices, weights, …',
      type: 'Number'
    },
    {
      name: 'Date & Time',
      description: 'Good for dates or dates and time',
      type: 'Date'
    },
    {
      name: 'Location',
      description: 'Good for addresses and coordinates',
      type: 'Location'
    },
    {
      name: 'Media',
      description: 'Good for images, videos, PDFs, Word files, etc',
      type: {single: 'Link', multiple: 'Array'},
      linkType: 'Asset'
    },
    {
      name: 'Boolean',
      description: 'Good for simple Yes/No flags',
      type: 'Boolean'
    },
    {
      name: 'JSON Object',
      description: 'Good for JSON snippets',
      type: 'Object'
    },
    {
      name: 'Reference',
      description: 'Link your Content Types',
      type: {single: 'Link', multiple: 'Array'},
      linkType: 'Entry'
    },
]);
