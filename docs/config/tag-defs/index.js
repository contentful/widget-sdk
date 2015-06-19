'use strict';

module.exports = function tagDefs (extractTypeTransform, wholeTagTransform, extractNameTransform) {
  return [{
    name: 'module',
    defaultFn: function (doc) {
      if (doc.docType === 'module')
        return doc.name;
      if (~doc.fileInfo.projectRelativePath.indexOf('test'))
        return 'contentful/test';
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
  },
  usageTagDef('jade'),
  usageTagDef('html'),
  usageTagDef('js'),
  {
    name: 'method',
    multi: true,
    docProperty: 'methods',
    transforms: [extractTypeTransform, extractNameTransform, wholeTagTransform]
  }, {
    name: 'todo',
    multi: true
  }];
};

function usageTagDef (lang) {
  return {
    name: `usage[${lang}]`,
    docProperty: 'usage',
    transforms: function (doc, tag, value) {
      doc.usageLang = lang;
      return value;
    }
  };
}
