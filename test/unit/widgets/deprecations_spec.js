'use strict';

describe('widgets/deprecations', function() {
  var createFilter;
  var deprecations;

  function deprecate (widgetId, deprecation) {
    deprecations[widgetId] = deprecation;
  }


  beforeEach(function() {
    module('contentful/test');
    deprecations = this.$inject('widgets/deprecations/data');

    var deprecator = this.$inject('widgets/deprecations');
    createFilter = deprecator.createFilter;
  });

  it('removes deprecated widget if field matches', function () {
    var widgets = [
      {id: 'DEPRECATED'},
      {id: 'not deprecated'}
    ];

    deprecate('DEPRECATED', {field: {type: 'FIELD'}});

    var filter = createFilter(null, {type: 'FIELD'});
    var filtered = filter(widgets);

    expect(filtered).toEqual([{id: 'not deprecated'}]);
  });

  it('retains current widget', function () {
    var widgets = [{id: 'DEPRECATED'}];

    deprecate('DEPRECATED', {field: {type: 'FIELD'}});

    var filter = createFilter('DEPRECATED', {type: 'FIELD'});
    var filtered = filter(widgets);

    expect(filtered[0].id).toEqual('DEPRECATED');
  });

  it('adds deprecation information', function () {
    var widgets = [{id: 'DEPRECATED'}];

    deprecate('DEPRECATED', 'INFO');

    var filter = createFilter('DEPRECATED');
    var filtered = filter(widgets);

    expect(filtered).toEqual([{id: 'DEPRECATED', deprecation: 'INFO'}]);
  });

  it('retains preview widget if preview is enabled', function () {
    var widgets = [{id: 'DEPRECATED'}];

    deprecate('DEPRECATED', {preview: true});

    var filter = createFilter(null, {}, true);
    var filtered = filter(widgets);

    expect(filtered).toEqual([{id: 'DEPRECATED', deprecation: {preview: true}}]);
  });

  it('removes preview widget if preview is disabled', function () {
    var widgets = [{id: 'DEPRECATED'}];

    deprecate('DEPRECATED', {preview: true});

    var filter = createFilter(null, {}, false);
    var filtered = filter(widgets);

    expect(filtered.length).toBe(0);
  });

});
