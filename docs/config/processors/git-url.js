'use strict';

import _ from 'lodash-node';

export default function gitUrlProcessor () {
  return {
    $runAfter: ['files-read'],
    $runBefore: ['rendering-docs'],
    $process: function (docs) {
      _.each(docs, function (doc) {
        if (!doc.fileInfo)
          return;
        var base = 'https://github.com/contentful/user_interface/blob/master/';
        var path = doc.fileInfo.projectRelativePath;
        var line = doc.endingLine + 1;
        doc.gitUrl = base + path + '#L' + line;
      });
    }
  };
}
