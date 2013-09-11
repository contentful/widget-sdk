'use strict';

// Dummy content type that is used to generate the Asset form
// in the same manner the Entry form is generated
angular.module('contentful').constant('AssetContentType', {
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: true,
      disabled: false,
      required: true
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      localized: true,
      disabled: false
    },
    {
      id: 'file',
      name: 'File',
      type: 'File',
      localized: true,
      disabled: false,
      required: true
    }
  ]
});
