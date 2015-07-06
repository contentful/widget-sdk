'use strict';

var _ = require('lodash-node');
var path = require('canonical-path');


var DOC_TYPE_NAMES = {
  directive: 'Directives',
  type: 'Types',
  service: 'Services'
};

/**
 * Create an index for all API documents and rendere it as a Angular
 * service.
 */
module.exports = function apiIndexProcessor() {
  return {
    $runAfter: ['paths-computed', 'generateKeywordsProcessor'],
    $runBefore: ['rendering-docs'],
    $process: function(docs) {
      docs.push(makeApiIndex(docs));
    }
  };
};


function makeApiIndex (docs) {
  docs = _.filter(docs, function(doc) {
    return doc.area == 'api';
  });
  var modules = makeModulesIndex(docs);

  return {
    docType: 'api-index',
    id: 'api-index',
    template: 'api-index.template.js',
    outputPath: 'js/api-index.js',
    modules: modules
  };
}


function makeModulesIndex(areaPages) {
    var modules = _.filter(areaPages, 'module');
    modules = _.groupBy(modules, 'module');
    return _.map(modules, makeModule);
}


function makeModule (modulePages, moduleName) {
  var docTypes = _.groupBy(modulePages, 'docType');

  // Extract the module page from the collection
  if (!docTypes.module)
    throw new Error(`Could not find documentation for module "${moduleName}"`);
  var modulePage = docTypes.module[0];
  delete docTypes.module;

  docTypes = _.map(docTypes, makeDocType);

  return {
    name: moduleName,
    href: modulePage.path,
    type: 'module',
    docTypes: docTypes
  };
}


function makeDocType (docs, docType) {
  if (docs.length === 0) {
    return;
  }

  var name = DOC_TYPE_NAMES[docType] || docType;

  return {
    name: name,
    type: 'section',
    href: path.dirname(docs[0].path),
    docs: _.map(docs, makeNav)
  };
}


function makeNav (doc) {
  return {
    name: doc.name,
    href: doc.path,
    type: doc.docType
  };
}
