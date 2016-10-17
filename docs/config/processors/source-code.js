import {forEach, includes} from 'lodash';

/**
 * Attaches the source following the doc string to the `source`
 * property of the doc.
 */
export default function sourceCodeProcessor () {
  return {
    $runAfter: ['docs-processed'],
    $runBefore: ['adding-extra-docs'],
    $process: function (docs) {
      forEach(docs, function (doc) {
        if (includes(['method', 'property'], doc.docType)) {
          console.log(doc.docType, doc.name)
          var loc = doc.codeNode.loc;
          var lines = doc.fileInfo.content.split('\n');
          doc.source = lines.slice(loc.start.line, loc.end.line).join('\n').trim();
        }
      });
    }
  };
}
