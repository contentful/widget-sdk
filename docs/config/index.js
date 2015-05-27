'use strict';

var path = require('path');
var packagePath = __dirname;
var _ = require('lodash-node');

var Package = require('dgeni').Package;

// Create and export a new Dgeni package called angularjs. This package depends upon
// the ngdoc,nunjucks and examples packages defined in the dgeni-packages npm module.
module.exports = new Package('angularjs', [
  require('dgeni-packages/ngdoc'),
  require('dgeni-packages/nunjucks'),
  require('dgeni-packages/examples')
])


.factory(require('./services/errorNamespaceMap'))
.factory(require('./services/getMinerrInfo'))
.factory(require('./services/getVersion'))
.factory(require('./services/gitData'))
.factory(require('./inline-tag-defs/type'))

.processor(require('./processors/keywords'))
.processor(require('./processors/pages-data'))
.processor(function gitUrlProcessor () {
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
})

.config(function (generateProtractorTestsProcessor) {
  generateProtractorTestsProcessor.$enabled = false;
})

.config(function (generateComponentGroupsProcessor) {
  generateComponentGroupsProcessor.$enabled = false;
})

.config(function(dgeni, log, readFilesProcessor, writeFilesProcessor) {

  dgeni.stopOnValidationError = true;
  dgeni.stopOnProcessingError = true;

  log.level = 'info';

  readFilesProcessor.basePath = path.resolve(__dirname,'../..');
  readFilesProcessor.sourceFiles = [
    { include: 'src/javascripts/**/*.js', basePath: 'src/javascripts' },
  ];

  writeFilesProcessor.outputFolder = 'public/docs';

})

.config(function (debugDumpProcessor) {
  // debugDumpProcessor.$enabled = true;
  debugDumpProcessor.filterFn = function (docs) {
    return _.map(docs, function (doc) {
      return _.omit(doc, [
        'fileInfo', 'renderedContent', 'source', 'content',
        'moduleDoc'
      ]);
    });
  };
})

.processor(function sourceCode () {
  return {
    $runAfter: ['docs-processed'],
    $runBefore: ['adding-extra-docs'],
    $process: function (docs) {
      _.forEach(docs, function (doc) {
        var loc = doc.codeNode.loc;
        var lines = doc.fileInfo.content.split('\n');
        doc.source = lines.slice(loc.start.line, loc.end.line).join('\n').trim();
      });
    }
  };
})

.factory(require('./tag-defs'))
.config(function(parseTagsProcessor, tagDefs) {
  var tds = parseTagsProcessor.tagDefinitions;
  tds = _.reject(tds, {name: 'method'});
  tds = tds.concat(tagDefs);
  parseTagsProcessor.tagDefinitions = tds;
})


.config(function(inlineTagProcessor, typeInlineTagDef) {
  inlineTagProcessor.inlineTagDefinitions.push(typeInlineTagDef);
})


.factory(function extractTypeTransform () {
  var TYPE_EXPRESSION_START = /\{[^@]/;
  return function (doc, tag, value) {
    var start, position, count, length;

    start = value.search(TYPE_EXPRESSION_START);
    length = value.length;
    if (start !== -1) {
      // advance to the first character in the type expression
      position = start + 1;
      count = 1;

      while (position < length) {
        switch (value[position]) {
          case '\\':
            // backslash is an escape character, so skip the next character
            position++;
            break;
          case '{':
            count++;
            break;
          case '}':
            count--;
            break;
          default:
            // do nothing
        }

        if (count === 0) {
          break;
        }
        position++;
      }

      tag.typeExpression = value.slice(start+1, position).trim().replace('\\}', '}').replace('\\{', '{');
      tag.description = (value.substring(0, start) + value.substring(position+1)).trim();
      return tag.description;
    } else {
      return value;
    }
  };

})

.config(function(templateFinder) {
  templateFinder.templateFolders.unshift(path.resolve(packagePath, '..', 'templates'));
  // renderDocsProcessor.extraData.git = gitData;
})


.config(function(computePathsProcessor, computeIdsProcessor, getAliases) {
  computePathsProcessor.pathTemplates.push({
    docTypes: ['overview', 'tutorial'],
    getPath: function(doc) {
      var docPath = path.dirname(doc.fileInfo.relativePath);
      if ( doc.fileInfo.baseName !== 'index' ) {
        docPath = path.join(docPath, doc.fileInfo.baseName);
      }
      return docPath;
    },
    outputPathTemplate: 'partials/${path}.html'
  });

  computePathsProcessor.pathTemplates.push({
    docTypes: ['indexPage'],
    pathTemplate: '.',
    outputPathTemplate: '${id}.html'
  });

  computePathsProcessor.pathTemplates.push({
    docTypes: ['module' ],
    pathTemplate: '${area}/${name}',
    outputPathTemplate: 'partials/${area}/${name}.html'
  });
  computePathsProcessor.pathTemplates.push({
    docTypes: ['componentGroup' ],
    pathTemplate: '${area}/${moduleName}/${groupType}',
    outputPathTemplate: 'partials/${area}/${moduleName}/${groupType}.html'
  });


  computePathsProcessor.pathTemplates.push({
    docTypes: ['analytics-event'],
    pathTemplate: 'analytics-event',
    outputPathTemplate: 'partials/api/analytics/events/${name}.html'
  });
  computeIdsProcessor.idTemplates.push({
    docTypes: ['analytics-event' ],
    idTemplate: 'analytics/events/${name}',
    getAliases: getAliases
  });


  computeIdsProcessor.idTemplates.push({
    docTypes: ['overview', 'tutorial', 'e2e-test'],
    getId: function(doc) { return doc.fileInfo.baseName; },
    getAliases: function(doc) { return [doc.id]; }
  });
})

.factory(require('./template-tags'))
.config(function (templateEngine, templateTags) {
  var filters = require('./template-filters');
  templateEngine.tags = templateEngine.tags.concat(templateTags);
  templateEngine.filters = templateEngine.filters.concat(filters);
})

.config(function(checkAnchorLinksProcessor) {
  checkAnchorLinksProcessor.base = '/';
  // We are only interested in docs that have an area (i.e. they are pages)
  checkAnchorLinksProcessor.checkDoc = function(doc) { return doc.area; };
})


/**
 * TODO use this
 */
.config(function(generateExamplesProcessor) {
  generateExamplesProcessor.deployments = [
    {name: 'default'}
  ];
});
