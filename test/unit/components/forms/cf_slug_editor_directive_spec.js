'use strict';

describe('SlugEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');
    var MockApi = this.$inject('mocks/widgetApi');

    this.cfWidgetApi = MockApi.create({
      field: {
        id: 'slug'
      },
      contentType: {
        displayField: 'title'
      }
    });

    this.title = MockApi.createField();

    this.entrySys = {
      contentType: {sys: {id: 'CTID'}}
    };

    this.cfWidgetApi.entry = {
      getSys: sinon.stub().returns(this.entrySys),
      fields: {
        title: this.title
      }
    };

    this.compileElement = function () {
      return this.$compile('<cf-slug-editor>', {}, {
        cfWidgetApi: this.cfWidgetApi
      });
    };

    this.setNewSlug = function ($inputEl, slug) {
      $inputEl.val(slug);
      this.cfWidgetApi.field.getValue.returns(slug);
    };
  });

  describe('#titleToSlug', function () {
    it('uses an "untitled" slug with the entry creation time, when the title is empty', function () {
      this.entrySys.createdAt = '2015-01-28T10:38:28.989Z';
      var $inputEl = this.compileElement().find('input');

      expect($inputEl.val()).toEqual('untitled-entry-2015-01-28-at-10-38-28');
    });

    it('does not set the slug to a representation of the title', function () {
      this.title.onValueChanged.yields('This is a title');
      var $inputEl = this.compileElement().find('input');
      expect($inputEl.val()).toEqual('this-is-a-title');
    });

    it('does not track the title if both fields have diverged', function () {
      var slug = 'das-ist-ein-weiterer-titel';
      var $inputEl = this.compileElement().find('input');

      this.setNewSlug($inputEl, slug);

      // dispatch new title
      this.title.onValueChanged.yield('Some new title');

      // Notice the slug has not changed
      expect($inputEl.val()).toEqual(slug);
    });

    it('tracks the title if both fields have not diverged', function () {
      var $inputEl = this.compileElement().find('input');

      // Set similar slug and title
      this.setNewSlug($inputEl, 'this-is-the-first-title');
      this.title.getValue = sinon.stub().returns('This is the first title');

      // Change title
      this.title.onValueChanged.yield('This is the second title');

      // Notice the slug has been updated
      expect($inputEl.val()).toEqual('this-is-the-second-title');
    });

    it('does not track the title if it is published', function () {
      var $inputEl = this.compileElement().find('input');

      this.title.onValueChanged.yield('This is the first title');
      this.entrySys.publishedVersion = 1;

      this.title.onValueChanged.yield('This is the second title');
      expect($inputEl.val()).toEqual('this-is-the-first-title');

      this.entrySys.publishedVersion = null;
      this.title.onValueChanged.yield('This is the third title');
      expect($inputEl.val()).toEqual('this-is-the-third-title');
    });

    describe('field locale is different from default locale', function () {
      describe('title for field locale is empty', function () {
        it('should generate a slug using title value in default locale', function () {
          this.cfWidgetApi.field.locale = 'hi';

          var $inputEl = this.compileElement().find('input');

          this.title.getValue.returns('');
          this.title.onValueChanged.withArgs(this.cfWidgetApi.field.locale).yield('');
          expect($inputEl.val()).toMatch(/^untitled-entry/);
          this.title.onValueChanged.withArgs(this.cfWidgetApi.locales.default).yield('A title');
          expect($inputEl.val()).toEqual('a-title');
        });
      });
    });
  });

  describe('#alreadyPublished', function () {
    beforeEach(function () {
      this.inputEl = this.compileElement().find('input');
      this.entrySys.publishedVersion = 1;
      this.title.getValue.returns('old title');
      this.inputEl.val('old-title');
    });

    it('does not track title when entry is already published', function () {
      this.title.onValueChanged.yield('New title');
      expect(this.inputEl.val()).toEqual('old-title');
    });
  });

  describe('uniquenness state', function () {
    it('queries duplicates when input value changes', function () {
      var $inputEl = this.compileElement().find('input');
      var getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.reset();

      $inputEl.val('SLUG');
      this.$apply();
      sinon.assert.calledOnce(getEntries);
    });

    it('queries duplicates when field value changes', function () {
      this.compileElement();
      var getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.reset();

      this.cfWidgetApi.field.onValueChanged.yield('SLUG');
      this.$apply();
      sinon.assert.calledOnce(getEntries);
    });

    it('sets duplicate query parameters from entry sys', function () {
      this.entrySys.id = 'ENTRY ID';
      this.compileElement();
      var getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.reset();

      this.cfWidgetApi.field.onValueChanged.yield('SLUG');
      this.$apply();
      sinon.assert.calledWith(getEntries, {
        'content_type': 'CTID',
        'fields.slug': 'SLUG',
        'sys.id[ne]': 'ENTRY ID',
        'sys.publishedAt[exists]': true
      });
    });

    it('is "unique" when there are no duplicates', function () {
      var $inputEl = this.compileElement().find('input');
      var scope = $inputEl.scope();

      // The server responds with zero entries by default
      expect(scope.state).toEqual('unique');
    });

    it('is "duplicate" when there are matching entries in the query result', function () {
      var $inputEl = this.compileElement().find('input');
      var scope = $inputEl.scope();

      // Let the server respond with one entry
      this.cfWidgetApi.space.getEntries = sinon.stub().resolves({ total: 1 });

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();
      expect(scope.state).toEqual('duplicate');
      expect($inputEl.attr('aria-invalid')).toEqual('true');
    });

    it('is "checking" when the query has not been resolved', function () {
      var getEntries = sinon.stub().defers();
      this.cfWidgetApi.space.getEntries = getEntries;

      var $inputEl = this.compileElement().find('input');
      var scope = $inputEl.scope();

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();

      expect(scope.state).toEqual('checking');

      // Now 'receive' the server response by resolving the promise.
      getEntries.resolve({ total: 0 });
      this.$apply();
      expect(scope.state).toEqual('unique');
    });
  });
});
