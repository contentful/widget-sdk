'use strict';

var _ = require('lodash-node');
var path = require('canonical-path');

var AREA_NAMES = {
  api: 'API',
  guide: 'Developer Guide',
  misc: 'Miscellaneous',
  tutorial: 'Tutorial',
  error: 'Error Reference'
};

var DOC_TYPE_NAMES = {
  directive: 'Directives',
  type: 'Types'
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

      docs.push(makeNavDoc(pages));
      docs.push(makeSearchDoc(pages));
      docs.push(makePagesDoc(docs));
    }
  };
};

function makeArea (pages, areaId) {
  var navGroupMapper = navGroupMappers[areaId] || navGroupMappers['pages'];
  return {
    id: areaId,
    name: AREA_NAMES[areaId],
    modules: navGroupMapper(pages)
  };
}

function makeNav (doc) {
  return {
    name: doc.name,
    href: doc.path,
    type: doc.docType
  };
}

function makeDocType (docs, docType) {
  if (docs.length === 0) {
    return;
  }

  var name = DOC_TYPE_NAMES[docType];

  return {
    name: name,
    type: 'section',
    href: path.dirname(docs[0].path),
    docs: _.map(docs, makeNav)
  };
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

var navGroupMappers = {
  api: function(areaPages) {
    var modules = _.filter(areaPages, 'module');
    modules = _.groupBy(modules, 'module');
    return _.map(modules, makeModule);
  },
  pages: function(pages, area) {
    return [getNavGroup(
      pages,
      area,
      function(page) {
        return page.sortOrder || page.path;
      },
      function(page) {
        return {
          name: page.name,
          href: page.path,
          type: 'page'
        };
      }
    )];
  }
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

function makeNavDoc (docs) {
  docs = _.reject(docs, {docType: 'componentGroup'});

  var areas = _.groupBy(docs, 'area');
  areas = _.reduce(areas, function (areas, docs, area) {
    areas[area] = makeArea(docs, area);
    return areas;
  }, {});


  return {
    docType: 'nav-data',
    id: 'nav-data',
    template: 'nav-data.template.js',
    outputPath: 'js/nav-data.js',
    areas: areas
  };
}

function makePagesDoc(docs) {
  var pageData = _(docs)
  .map(function(doc) {
    return _.pick(doc, ['name', 'area', 'path']);
  })
  .indexBy('path')
  .value();

  return {
    docType: 'pages-data',
    id: 'pages-data',
    template: 'pages-data.template.js',
    outputPath: 'js/pages-data.js',
    pages: pageData
  };
}

function getNavGroup(pages, area, pageSorter, pageMapper) {
  var navItems = _(pages)
    // We don't want the child to include the index page as this is already catered for
    .omit(function(page) { return page.id === 'index'; })

    // Apply the supplied sorting function
    .sortBy(pageSorter)

    // Apply the supplied mapping function
    .map(pageMapper)

    .value();

  return {
    name: area.name,
    type: 'group',
    href: area.id,
    navItems: navItems
  };
}

