'use strict';

const _ = require('lodash');

// Dummy content type that is used to generate the Asset form
// in the same manner the Entry form is generated.
// Mimics instance of the `ContentType` class in this package.
module.exports = {
  getId: _.constant(undefined),
  data: {
    sys: {
      id: undefined,
      type: 'AssetContentType'
    },
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: true,
        disabled: false
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
  }
};
