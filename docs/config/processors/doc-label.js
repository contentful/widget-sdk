'use strict';

import {forEach} from 'lodash-node';

export default function docLabelProcessor () {
  return {
    $runAfter: ['tags-extracted'],
    $runBefore: ['processing-docs'],
    $process: function (docs) {
      forEach(docs, (doc) => {
        if (doc.docType === 'directive') {
          doc.label = dasherize(doc.name);
        } else {
          doc.label = doc.name;
        }

      });
    }
  };
}

function dasherize (string) {
  return string.replace(/[A-Z]/g, (a) => '-' + a.toLowerCase());
}
