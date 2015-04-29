'use strict';

var _ = require('lodash-node');
var path = require('canonical-path');


var DOC_TYPE_NAMES = {
  directive: 'Directives',
  type: 'Types',
  service: 'Services'
};

/**
 * @dgProcessor generatePagesDataProcessor
 * @description
 * This processor will create a new doc that will be rendered as a JavaScript file
 * containing meta information about the pages and navigation
 */
module.exports = function generatePagesDataProcessor() {
  return {
    $runAfter: ['paths-computed', 'generateKeywordsProcessor'],
    $runBefore: ['rendering-docs'],
    $process: function(docs) {

      // We are only interested in docs that are in an area
      var pages = _.filter(docs, function(doc) {
        return doc.area;
      });

      docs.push(makeApiIndex(pages));
      // docs.push(makeSearchDoc(pages));
    }
  };
};


function makeSearchDoc(docs) {
  var searchable = _.filter(docs, 'searchTerms');
  var searchData = _.map(searchable, function (doc) {
    return _.extend({ path: doc.path }, doc.searchTerms);
  });

  return {
    docType: 'json-doc',
    id: 'search-data-json',
    template: 'json-doc.template.json',
    outputPath: 'js/search-data.json',
    data: searchData
  };
}


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
