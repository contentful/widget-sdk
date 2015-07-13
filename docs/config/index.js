'use strict';

var path = require('path');
var packagePath = __dirname;
var _ = require('lodash-node');

var Package = require('dgeni').Package;

var templateFilters = require('./template-filters');

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
.factory(require('./services/extract-type-transform'))
.factory(require('./inline-tag-defs/type'))

.processor(require('./processors/git-url'))
.processor(require('./processors/source-code'))
.processor(require('./processors/keywords'))
.processor(require('./processors/doc-label'))
.processor(require('./processors/api-index'))

.processor(function analyticsDocsProcessor () {
  return {
    $runAfter: ['docs-processed'],
    $runBefore: ['extra-docs-added'],
    $process: function (docs) {
      var analytics = _.remove(docs, {docType: 'analytics-event'});
      docs.push({
        id: 'analytics-events',
        docType: 'overview',
        analytics: analytics,
        template: 'analytics-events.template.html',
        outputPath: 'partials/api/analytics-events.html'
      });
    }
  };
})

.processor(function memberUnionProcessor () {
  return {
    $runAfter: ['memberDocsProcessor'],
    $runBefore: ['moduleDocsProcessor'],
    $process: function (docs) {
      _.forEach(docs, function (doc) {
        doc.members = (doc.properties || [])
                      .concat(doc.methods || [])
                      .concat(doc.scopeProvides || []);
      });
    }
  };
})



.config(function(dgeni, log, readFilesProcessor, writeFilesProcessor) {

  dgeni.stopOnValidationError = true;
  dgeni.stopOnProcessingError = true;

  log.level = 'info';

  readFilesProcessor.basePath = path.resolve(__dirname,'../..');
  readFilesProcessor.sourceFiles = [
    { include: 'src/javascripts/**/*.js', basePath: 'src/javascripts' },
    { include: 'test/helpers/*.js', basePath: 'test/helpers' },
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


.factory(require('./tag-defs'))
.config(function(parseTagsProcessor, tagDefs) {
  var tds = parseTagsProcessor.tagDefinitions;
  tds = _.reject(tds, {name: 'method'});
  tds = tds.concat(tagDefs);
  parseTagsProcessor.tagDefinitions = tds;
})



.config(function(computePathsProcessor, computeIdsProcessor, getAliases) {
  computeIdsProcessor.idTemplates.push({
    docTypes: ['overview'],
    pathTemplate: '${area}/${name}',
    outputPathTemplate: 'partials/${path}.html',
    getId: function(doc) { return doc.fileInfo.baseName; },
    getAliases: function(doc) { return [doc.id]; }
  });

  computePathsProcessor.pathTemplates.push({
    docTypes: ['module'],
    pathTemplate: '${area}/${name}',
    outputPathTemplate: 'partials/${path}.html',
    getAliases: getAliases
  });

  computePathsProcessor.pathTemplates.push({
    docTypes: ['directive', 'service', 'type', 'controller'],
    pathTemplate: '${area}/${module}/${docType}/${name}',
    outputPathTemplate: 'partials/${path}.html',
    getAliases: getAliases
  });
})

.factory(require('./template-tags'))
.config(function (templateEngine, templateTags) {
  templateEngine.tags = templateEngine.tags.concat(templateTags);
  templateEngine.filters = templateEngine.filters.concat(templateFilters);
})

.config(function(checkAnchorLinksProcessor) {
  checkAnchorLinksProcessor.base = '/';
  // We are only interested in docs that have an area (i.e. they are pages)
  checkAnchorLinksProcessor.checkDoc = function(doc) { return doc.area; };
})


.config(function(inlineTagProcessor, typeInlineTagDef) {
  inlineTagProcessor.inlineTagDefinitions.push(typeInlineTagDef);
})



.config(function(templateFinder) {
  templateFinder.templateFolders.unshift(path.resolve(packagePath, '..', 'templates'));
  // renderDocsProcessor.extraData.git = gitData;
})

.config(function (generateProtractorTestsProcessor) {
  generateProtractorTestsProcessor.$enabled = false;
})

.config(function (generateComponentGroupsProcessor) {
  generateComponentGroupsProcessor.$enabled = false;
})
/**
 * TODO use this
 */
.config(function(generateExamplesProcessor) {
  generateExamplesProcessor.deployments = [
    {name: 'default'}
  ];
});
