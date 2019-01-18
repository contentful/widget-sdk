describe('SlugEditor directive', () => {
  beforeEach(function() {
    this.locales = [
      { code: 'default-LOCALE', optional: false, fallbackCode: null },
      { code: 'some-LOCALE', optional: false, fallbackCode: null },
      { code: 'with-fallback-LOCALE', optional: false, fallbackCode: 'some-LOCALE' },
      { code: 'optional-with-fallback-LOCALE', optional: true, fallbackCode: 'some-LOCALE' }
    ];

    module('contentful/test', $provide => {
      $provide.constant('TheLocaleStore', {
        getPrivateLocales: () => this.locales
      });
    });

    const MockApi = this.$inject('mocks/widgetApi');

    this.cfWidgetApi = MockApi.create({
      locales: {
        default: 'default-LOCALE',
        available: [
          'default-LOCALE',
          'some-LOCALE',
          'with-fallback-LOCALE',
          'optional-with-fallback-LOCALE'
        ]
      },
      field: {
        id: 'slug',
        locale: 'some-LOCALE'
      },
      contentType: {
        displayField: 'title'
      }
    });

    this.title = MockApi.createField();

    this.entrySys = {
      contentType: { sys: { id: 'CTID' } },
      createdAt: 1000
    };

    this.cfWidgetApi.entry = {
      getSys: sinon.stub().returns(this.entrySys),
      fields: {
        title: this.title
      }
    };

    this.compileElement = function() {
      return this.$compile(
        '<cf-slug-editor>',
        {},
        {
          cfWidgetApi: this.cfWidgetApi
        }
      );
    };
  });

  describe('slug generated from entry title', function() {
    describe('field locale is the default locale', function() {
      it('uses an "untitled" slug with the entry creation time, when the title is empty', function() {
        this.entrySys.createdAt = '2015-01-28T10:38:28.989Z';
        const $inputEl = this.compileElement().find('input');

        expect($inputEl.val()).toEqual('untitled-entry-2015-01-28-at-10-38-28');
      });

      it('sets slug to initial title', function() {
        this.title.onValueChanged.yields('This is a title');
        const $inputEl = this.compileElement().find('input');
        expect($inputEl.val()).toEqual('this-is-a-title');
      });

      it('does not update slug if it has diverged from title field', function() {
        const $inputEl = this.compileElement().find('input');

        const slug = 'does-not-match';
        $inputEl.val(slug);
        this.title.onValueChanged.yield('Some new title');
        expect($inputEl.val()).toEqual(slug);
      });

      it('updates slug if it has not diverged from title field', function() {
        const $inputEl = this.compileElement().find('input');
        this.title.onValueChanged.yield('This is the first title');
        expect($inputEl.val()).toEqual('this-is-the-first-title');
        this.title.onValueChanged.yield('This is the second title');
        expect($inputEl.val()).toEqual('this-is-the-second-title');
      });

      it('does not update slug after entry got published', function() {
        const $inputEl = this.compileElement().find('input');

        this.title.onValueChanged.yield('This is the first title');
        this.entrySys.publishedVersion = 1;

        this.title.onValueChanged.yield('This is the second title');
        expect($inputEl.val()).toEqual('this-is-the-first-title');

        this.entrySys.publishedVersion = null;
        this.title.onValueChanged.yield('This is the first title');
        this.title.onValueChanged.yield('This is the third title');
        expect($inputEl.val()).toEqual('this-is-the-third-title');
      });
    });

    describe('field locale is not the default locale', () => {
      describe('empty field locale title', () => {
        beforeEach(function() {
          this.cfWidgetApi.field.locale = 'some-LOCALE';
        });

        it('uses default locale`s title for slug', function() {
          const $inputEl = this.compileElement().find('input');

          this.title.onValueChanged.withArgs(this.cfWidgetApi.locales.default).yield('A title');
          expect($inputEl.val()).toEqual('a-title');
        });

        it('sets “untitled-entry-…” as slug if empty default locale title', function() {
          const $inputEl = this.compileElement().find('input');

          this.title.onValueChanged.withArgs(this.cfWidgetApi.field.locale).yield('');
          expect($inputEl.val()).toMatch(/^untitled-entry-/);
        });
      });

      describe('field locale is optional and has a fallback', function() {
        beforeEach(function() {
          this.cfWidgetApi.field.required = true;
          this.cfWidgetApi.field.locale = 'optional-with-fallback-LOCALE';
        });

        it('does not generate a slug on default locale title updates', function() {
          const $inputEl = this.compileElement().find('input');

          sinon.assert.neverCalledWith(this.title.onValueChanged, 'default-LOCALE');
          expect($inputEl.val()).toEqual('');
        });

        it('updates the slug if the same locale`s title changes', function() {
          const $inputEl = this.compileElement().find('input');

          this.title.onValueChanged.withArgs(this.cfWidgetApi.field.locale).yield('A title');

          expect($inputEl.val()).toEqual('a-title');
        });
      });

      describe('field is not required and locale has a fallback', function() {
        beforeEach(function() {
          this.cfWidgetApi.field.required = false;
          this.cfWidgetApi.field.locale = 'with-fallback-LOCALE';
        });

        it('does not generate a slug on default locale title updates', function() {
          const $inputEl = this.compileElement().find('input');

          sinon.assert.neverCalledWith(this.title.onValueChanged, 'default-LOCALE');
          expect($inputEl.val()).toEqual('');
        });

        it('updates the slug if the same locale`s title changes', function() {
          const $inputEl = this.compileElement().find('input');

          this.title.onValueChanged.withArgs(this.cfWidgetApi.field.locale).yield('A title');

          expect($inputEl.val()).toEqual('a-title');
        });
      });
    });
  });

  it('does not set the slug if user cannot edit the field', function() {
    this.cfWidgetApi.fieldProperties.access$.set({ denied: true, disabled: true });
    this.cfWidgetApi.field.setValue('INITIAL');
    this.cfWidgetApi.field.setValue.reset();
    this.title.onValueChanged.yields('A title');

    const $inputEl = this.compileElement().find('input');

    sinon.assert.notCalled(this.cfWidgetApi.field.setValue);
    expect($inputEl.val()).toBe('INITIAL');
  });

  it('updates to a slugified title only when the user has not created a custom slug', function() {
    const $inputEl = this.compileElement().find('input');
    expect($inputEl.val()).toMatch(/^untitled-entry-/);
    $inputEl.val('slugified-title');
    this.title.onValueChanged.yield('Slugified Title');
    this.$apply();
    expect($inputEl.val()).toEqual('slugified-title');
    this.title.onValueChanged.yield('Slugified Title With More Text');
    this.$apply();
    expect($inputEl.val()).toEqual('slugified-title-with-more-text');
    $inputEl.val('custom-slug');
    this.title.onValueChanged.yield('Slugified Title With Different Text');
    this.$apply();
    expect($inputEl.val()).toEqual('custom-slug');
  });

  describe('already published entry`s slug', () => {
    beforeEach(function() {
      this.inputEl = this.compileElement().find('input');
      this.entrySys.publishedVersion = 1;
      this.title.getValue.returns('old title');
      this.inputEl.val('old-title');
    });

    it('does not update slug after title changed', function() {
      this.title.onValueChanged.yield('New title');
      expect(this.inputEl.val()).toEqual('old-title');
    });
  });

  describe('uniqueness check', () => {
    it('queries duplicates when input value changes', function() {
      const $inputEl = this.compileElement().find('input');
      const getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.resetHistory();

      $inputEl.val('SLUG');
      this.$apply();
      sinon.assert.calledOnce(getEntries);
    });

    it('queries duplicates when field value changes', function() {
      this.compileElement();
      const getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.resetHistory();

      this.cfWidgetApi.field.onValueChanged.yield('SLUG');
      this.$apply();
      sinon.assert.calledOnce(getEntries);
    });

    it('sets duplicate query parameters from entry sys', function() {
      this.entrySys.id = 'ENTRY ID';
      this.compileElement();
      const getEntries = this.cfWidgetApi.space.getEntries;
      getEntries.resetHistory();

      this.cfWidgetApi.field.onValueChanged.yield('SLUG');
      this.$apply();
      sinon.assert.calledWith(getEntries, {
        content_type: 'CTID',
        'fields.slug.some-LOCALE': 'SLUG',
        'sys.id[ne]': 'ENTRY ID',
        'sys.publishedAt[exists]': true
      });
    });

    it('is "unique" when there are no duplicates', function() {
      const $inputEl = this.compileElement().find('input');
      const scope = $inputEl.scope();

      $inputEl.val('SLUG');
      this.$apply();

      // The server responds with zero entries by default
      expect(scope.state).toEqual('unique');
    });

    it('is "duplicate" when there are matching entries in the query result', function() {
      const $inputEl = this.compileElement().find('input');
      const scope = $inputEl.scope();

      // Let the server respond with one entry
      this.cfWidgetApi.space.getEntries = sinon.stub().resolves({ total: 1 });

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();
      expect(scope.state).toEqual('duplicate');
      expect($inputEl.attr('aria-invalid')).toEqual('true');
      expect(this.cfWidgetApi._state.isInvalid).toBe(true);
    });

    it('is "checking" when the query has not been resolved', function() {
      const getEntries = sinon.stub().defers();
      this.cfWidgetApi.space.getEntries = getEntries;

      const $inputEl = this.compileElement().find('input');
      const scope = $inputEl.scope();

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();

      expect(scope.state).toEqual('checking');

      // Now 'receive' the server response by resolving the promise.
      getEntries.resolve({ total: 0 });
      this.$apply();
      expect(scope.state).toEqual('unique');
    });

    it('does not show "duplicate" when there are uniqueness errors in the API response', function() {
      const $duplicateEl = this.compileElement().find('.cfnext-form__field-error');
      const scope = $duplicateEl.scope();

      this.cfWidgetApi.fieldProperties.schemaErrors$.set([{ name: 'unique' }]);
      // Let the server respond with one entry
      this.cfWidgetApi.space.getEntries = sinon.stub().resolves({ total: 1 });

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();
      expect(scope.hasUniqueValidationError).toEqual(true);
      expect(scope.state).toEqual('duplicate');
      expect($duplicateEl.hasClass('ng-hide')).toBe(true);
    });

    it('does show "duplicate" when there are no uniqueness errors in the API response', function() {
      const $duplicateEl = this.compileElement().find('.cfnext-form__field-error');
      const scope = $duplicateEl.scope();
      // Let the server respond with one entry
      this.cfWidgetApi.space.getEntries = sinon.stub().resolves({ total: 1 });

      // Trigger status update
      this.title.onValueChanged.yield('New Title');
      this.$apply();
      expect(scope.hasUniqueValidationError).toEqual(false);
      expect(scope.state).toEqual('duplicate');
      expect($duplicateEl.hasClass('ng-hide')).toBe(false);
    });
  });

  describe('when the slug is the entry title', function() {
    it('does not track the title field (itself)', function() {
      this.cfWidgetApi.field.locale = 'default-LOCALE';
      this.cfWidgetApi.contentType.displayField = 'slug';
      const $inputEl = this.compileElement().find('input');
      this.cfWidgetApi.field.onValueChanged.yield('new-slug');
      this.$apply();
      expect($inputEl.val()).toEqual('new-slug');
    });
  });
});
