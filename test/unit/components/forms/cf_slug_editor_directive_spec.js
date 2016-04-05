'use strict';

describe('SlugEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q');

    this.$q = $q;

    this.initialSys = {
      id: 'eins',
      publishedVersion: 0,
      createdAt: '2015-01-28T10:38:28.989Z',
      contentType: {
        sys: {
          id: 'zwei'
        }
      }
    };

    var newSignal = this.$inject('signal').createMemoized;
    var valueChangedSignal = newSignal('');
    var disabledStatusSignal = newSignal(false);

    this.sysChangedSignal = newSignal(this.initialSys);
    this.titleChangedSignal = newSignal('');

    this.title = {
      getValue: sinon.stub().returns(''),
      onValueChanged: function (locale, cb) {
        return this.titleChangedSignal.attach(cb);
      }.bind(this)
    };

    this.cfWidgetApi = {
      field: {
        onValueChanged: valueChangedSignal.attach,
        onDisabledStatusChanged: disabledStatusSignal.attach,
        locale: 'en-US',
        setString: sinon.stub(),
        getValue: sinon.stub().returns(''),
        id: 'slug'
      },
      entry: {
        fields: {
          title: this.title
        },
        onSysChanged: this.sysChangedSignal.attach
      },
      space: {
        getEntries: sinon.stub().resolves({ total: 0 })
      },
      locales: {
        default: 'en-US'
      },
      contentType: {
        displayField: 'title'
      }
    };

    this.compileElement = function () {
      return this.$compile('<cf-slug-editor>', {}, {
        cfWidgetApi: this.cfWidgetApi
      });
    };

    this.setNewSlug = function ($inputEl, slug) {
      $inputEl.val(slug);
      this.cfWidgetApi.field.getValue = sinon.stub().returns(slug);
    };

    function setAndDispatchPublishVersion(obj, version) {
      obj.initialSys.publishedVersion = version;
      obj.sysChangedSignal.dispatch(obj.initialSys);
    }

    this.publishEntry = setAndDispatchPublishVersion.bind(null, this, 1);
    this.unpublishEntry = setAndDispatchPublishVersion.bind(null, this, 0);
  });

  describe('#titleToSlug', function () {
    it('should use an "untitled" slug with the entry creation time, when the title is empty', function () {
      var $inputEl = this.compileElement().children('input');

      expect($inputEl.val()).toEqual('untitled-entry-2015-01-28-at-10-38-28');
    });

    it('should set the slug to a representation of the title', function () {
      this.titleChangedSignal.dispatch('This is a title');
      var $inputEl = this.compileElement().children('input');
      expect($inputEl.val()).toEqual('this-is-a-title');
    });

    it('should not track the title if both fields have diverged', function () {
      var slug = 'das-ist-ein-weiterer-titel';
      var $inputEl = this.compileElement().children('input');

      this.setNewSlug($inputEl, slug);

      // dispatch new title
      this.titleChangedSignal.dispatch('Some new title');

      // Notice the slug has not changed
      expect($inputEl.val()).toEqual(slug);
    });

    it('should track the title if both fields have not diverged', function () {
      var $inputEl = this.compileElement().children('input');

      // Set similar slug and title
      this.setNewSlug($inputEl, 'this-is-the-first-title');
      this.title.getValue = sinon.stub().returns('This is the first title');

      // Change title
      this.titleChangedSignal.dispatch('This is the second title');

      // Notice the slug has been updated
      expect($inputEl.val()).toEqual('this-is-the-second-title');
    });

    it('should not track the title if the entry has been published', function () {
      var $inputEl = this.compileElement().children('input');

      // Write a title
      this.titleChangedSignal.dispatch('This is the first title');

      // Publish the entry
      this.publishEntry();

      // Change the title
      this.titleChangedSignal.dispatch('This is the second title');

      // Notice the slug is still the first title
      expect($inputEl.val()).toEqual('this-is-the-first-title');
    });

    it('should resume tracking title if the entry has been published and unpublished', function () {
      var $inputEl = this.compileElement().children('input');

      // Write a title
      this.titleChangedSignal.dispatch('This is the first title');

      // Publish the entry
      this.publishEntry();

      // Unpublish the entry
      this.unpublishEntry();

      // Change the title
      this.titleChangedSignal.dispatch('This is the second title');

      // Notice the slug is updated
      expect($inputEl.val()).toEqual('this-is-the-second-title');
    });

    describe('field locale is different from default locale', function () {
      describe('title for field locale is empty', function () {
        beforeEach(function () {
          this.title.onValueChanged = function (locale, cb) {
            return this.titleChangedSignal.attach(function (titleLocale, value) {
              if (locale === titleLocale) {
                cb(value);
              }
            });
          }.bind(this);
        });
        it('should generate a slug using title value in default locale', function () {
          this.cfWidgetApi.field.locale = 'hi';
          this.cfWidgetApi.entry.fields.title.getValue = sinon.stub().returns('a title');

          var $inputEl = this.compileElement().children('input');

          this.cfWidgetApi.entry.fields.title.getValue.reset();
          this.titleChangedSignal.dispatch(this.cfWidgetApi.field.locale, '');
          sinon.assert.calledOnce(this.cfWidgetApi.entry.fields.title.getValue);
          this.titleChangedSignal.dispatch(this.cfWidgetApi.locales.default, 'A title');
          expect($inputEl.val()).toEqual('a-title');
        });
      });
    });
  });

  describe('#alreadyPublished', function () {
    beforeEach(function () {
      this.inputEl = this.compileElement().children('input');
      this.publishEntry();
      this.title.getValue = sinon.stub().returns('old title');
      this.inputEl.val('old-title');
    });

    it('does not track title when entry is already published', function () {
      // change title
      this.titleChangedSignal.dispatch('New title');

      expect(this.inputEl.val()).toEqual('old-title');
    });
  });

  describe('uniquenness state', function () {
    it('queries duplicates when input value changes', function () {
      var $inputEl = this.compileElement().children('input');
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

      this.valueChangedSignal.dispatch('SLUG');
      this.$apply();
      sinon.assert.calledOnce(getEntries);
    });

    it('sets duplicate query parameters from entry sys', function () {
      this.entrySys.id = 'ENTRY ID';
      this.compileElement();
      var getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.reset();

      this.valueChangedSignal.dispatch('SLUG');
      this.$apply();
      sinon.assert.calledWith(getEntries, {
        'content_type': 'CTID',
        'fields.slug': 'SLUG',
        'sys.id[ne]': 'ENTRY ID',
        'sys.publishedAt[exists]': true
      });
    });

    it('is "unique" when there are no duplicates', function () {
      var $inputEl = this.compileElement().children('input');
      var scope = $inputEl.scope();

      // The server responds with zero entries by default
      expect(scope.state).toEqual('unique');
      expect($inputEl.val()).toEqual('untitled-entry-2015-01-28-at-10-38-28');
    });

    it('should show the state as unique when there are matching entries in the query result', function () {
      var $inputEl = this.compileElement().children('input');
      var scope = $inputEl.scope();

      // Let the server respond with one entry
      this.cfWidgetApi.space.getEntries = sinon.stub().resolves({ total: 1 });

      // Set a new title.
      this.titleChangedSignal.dispatch('New Title');

      // settle the getEntries promise
      this.$apply();
      expect(scope.state).toEqual('duplicate');
      expect($inputEl.val()).toEqual('new-title');
    });

    it('should show the state as "checking" when the query has not been resolved', function () {
      var $q = this.$q;
      var responsePDeferred = $q.defer();

      // Return a promise without resolving it yet, to mimic a delay in the server's response
      this.cfWidgetApi.space.getEntries = function () {
        return responsePDeferred.promise;
      };
      var $inputEl = this.compileElement().children('input');
      var scope = $inputEl.scope();

      // Set a new title
      this.titleChangedSignal.dispatch('New Title');
      this.$apply();

      expect(scope.state).toEqual('checking');

      // Now 'receive' the server response by resolving the promise.
      responsePDeferred.resolve({ total: 0 });
      this.$apply();

      expect(scope.state).toEqual('unique');
      expect($inputEl.val()).toEqual('new-title');
    });
  });
});
