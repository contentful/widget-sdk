'use strict';

module.exports = function tagDefs (extractTypeTransform, wholeTagTransform, extractNameTransform) {
  return [{
    name: 'module',
    defaultFn: function (doc) {
      if (doc.docType === 'module')
        return doc.name;
      if (doc.area === 'api' && doc.docType !== 'overview')
        return 'contentful/app';
    }
  }, {
    name: 'scope.provides',
    multi: true,
    docProperty: 'properties',
    transforms: [extractTypeTransform, extractNameTransform, wholeTagTransform]
  }, {
    name: 'scope.requires',
    multi: true,
    docProperty: 'scopeRequires',
    transforms: [extractTypeTransform, extractNameTransform, wholeTagTransform]
  }, {
    name: 'usage[jade]',
    docProperty: 'usage',
  }, {
    name: 'usage[html]',
    docProperty: 'usage',
    transforms: function (doc, tag, value) {
      doc.usageLang = 'html';
      return value;
    }
  }, {
    name: 'method',
    multi: true,
    docProperty: 'methods',
    transforms: [extractTypeTransform, extractNameTransform, wholeTagTransform]
  }];
};
