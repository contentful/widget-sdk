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

  describe('per field deprecation', function () {
    beforeEach(function () {
      deprecate('DEPRECATED', {field: ['FIELD'], name: 'DEPRECATION'});
    });

    it('removes deprecated widget if field matches', function () {
      var widgets = [
        {id: 'DEPRECATED'},
        {id: 'not deprecated'}
      ];

      var filter = createFilter(null, {type: 'FIELD'});
      var filtered = filter(widgets);

      expect(filtered).toEqual([{id: 'not deprecated'}]);
    });

    it('retains deprecated widget if field does not match', function () {
      var widgets = [
        {id: 'DEPRECATED'},
      ];

      var filter = createFilter(null, {type: 'OTHER'});
      var filtered = filter(widgets);

      expect(filtered).toEqual([{id: 'DEPRECATED'}]);
    });

    it('retains current widget', function () {
      var widgets = [{id: 'DEPRECATED'}];
      var filter = createFilter('DEPRECATED', {type: 'FIELD'});
      var filtered = filter(widgets);

      expect(filtered[0].id).toEqual('DEPRECATED');
      expect(filtered[0].deprecation.name).toEqual('DEPRECATION');
    });
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
