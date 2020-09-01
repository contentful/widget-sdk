import { $initialize, $inject, $apply } from 'test/utils/ng';

const enLocale = { internal_code: 'en', code: 'en' };
const deLocale = { internal_code: 'de', code: 'de' };

describe('FormWidgetsController#widgets', () => {
  beforeEach(async function () {
    await $initialize(this.system);

    $inject('mocks/spaceContext').init();
    this.scope = $inject('$rootScope').$new();

    this.scope.editorContext = $inject('mocks/entityEditor/Context').create();
    this.scope.contentType = { getId: () => 'ctid' };
    this.scope.preferences = {};
    this.scope.otDoc = $inject('mocks/entityEditor/Document').create();
    this.scope.localeData = {
      defaultLocale: enLocale,
      privateLocales: [enLocale, deLocale],
    };

    this.field = {
      id: 'foo',
      apiName: 'foo',
      localized: true,
    };

    const controls = [
      {
        widgetId: 'foo',
        fieldId: 'foo',
        field: this.field,
      },
    ];

    this.createController = function () {
      const $controller = $inject('$controller');
      $controller('FormWidgetsController', { $scope: this.scope, controls });
      $apply();
    };
  });

  it('exposes enabled field', function () {
    this.createController();
    expect(this.scope.widgets.length).toBe(1);
  });

  it('caches field locale listeners', function () {
    this.createController();

    const { flat, lookup } = this.scope.fieldLocaleListeners;

    expect(flat.length).toBe(2);
    expect(flat[0].fieldId).toBe(this.field.apiName);
    expect(flat[0].localeCode).toBe(enLocale.code);
    expect(flat[1].fieldId).toBe(this.field.apiName);
    expect(flat[1].localeCode).toBe(deLocale.code);

    expect(Object.keys(lookup[this.field.apiName]).sort()).toEqual(
      [enLocale.code, deLocale.code].sort()
    );
  });

  describe('when the single-locale mode is on', function () {
    beforeEach(function () {
      this.scope.localeData.isSingleLocaleModeOn = true;
    });

    describe('and the focused locale is the default locale', function () {
      beforeEach(function () {
        this.scope.localeData.focusedLocale = enLocale;
      });

      describe('and the field is disabled', function () {
        beforeEach(function () {
          this.field.disabled = true;
          this.scope.preferences.showDisabledFields = false;
          this.createController();
        });

        it('does not show the field', function () {
          expect(this.scope.widgets.length).toBe(0);
        });

        describe('and the preference flag is set', function () {
          beforeEach(function () {
            this.scope.preferences.showDisabledFields = true;
          });

          it('shows the fields if the preference flag is set', function () {
            $apply();
            expect(this.scope.widgets.length).toBe(1);
          });
        });

        describe('and the field has errors', function () {
          beforeEach(function () {
            this.validator = this.scope.editorContext.validator;
            this.validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
          });

          it('shows the field', function () {
            this.validator.errors$.set([]);
            expect(this.scope.widgets.length).toBe(1);
          });
        });
      });
    });

    describe('and the focused locale is not the default locale', function () {
      beforeEach(function () {
        this.scope.localeData.focusedLocale = deLocale;
      });

      describe('and the field is not localized', function () {
        beforeEach(function () {
          this.field.localized = false;
          this.createController();
          this.field.disabled = false;
          this.scope.preferences.showDisabledFields = true;
          const validator = this.scope.editorContext.validator;
          validator.hasFieldError.withArgs('foo').returns(true);
          validator.errors$.set([]);
        });

        it('does not show the field', function () {
          $apply();
          expect(this.scope.widgets.length).toBe(0);
        });

        describe('and the field locale has errors', function () {
          beforeEach(function () {
            this.validator = this.scope.editorContext.validator;
            this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
          });

          it('shows the field', function () {
            this.validator.errors$.set([]);
            expect(this.scope.widgets.length).toBe(1);
          });
        });
      });

      describe('and the field is localized', function () {
        beforeEach(function () {
          this.field.localized = true;
          this.createController();
        });

        it('shows the field', function () {
          expect(this.scope.widgets.length).toBe(1);
        });

        describe('and the field is disabled', function () {
          beforeEach(function () {
            this.field.disabled = true;
            this.createController();
          });

          it('does not show the field', function () {
            $apply();
            expect(this.scope.widgets.length).toBe(0);
          });

          describe('and the preference field is set', function () {
            beforeEach(function () {
              this.scope.preferences.showDisabledFields = true;
            });

            it('shows the field', function () {
              $apply();
              expect(this.scope.widgets.length).toBe(1);
            });
          });

          describe('and the field locale has errors', function () {
            beforeEach(function () {
              this.validator = this.scope.editorContext.validator;
              this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
            });

            it('shows the field', function () {
              this.validator.errors$.set([]);
              expect(this.scope.widgets.length).toBe(1);
            });
          });

          describe('and the field locale does not have errors', function () {
            beforeEach(function () {
              this.validator = this.scope.editorContext.validator;
              this.validator.hasFieldError.withArgs('foo').returns(true);
              this.validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
              this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(false);
            });

            it('does not show the field', function () {
              this.validator.errors$.set([]);
              expect(this.scope.widgets.length).toBe(0);
            });
          });
        });
      });
    });
  });

  describe('when the multi-locale mode is on', function () {
    beforeEach(function () {
      this.scope.localeData.isSingleLocaleModeOn = false;
    });

    describe('and the field is disabled', function () {
      beforeEach(function () {
        this.field.disabled = true;
        this.createController();
      });

      it('does not show the field', function () {
        $apply();
        expect(this.scope.widgets.length).toBe(0);
      });

      it('shows the fields if the preference flag is set', function () {
        this.scope.preferences.showDisabledFields = true;
        $apply();
        expect(this.scope.widgets.length).toBe(1);
      });

      it('shows the field if it has errors', function () {
        const validator = this.scope.editorContext.validator;
        validator.hasFieldError.withArgs('foo').returns(true);
        validator.errors$.set([]);
        expect(this.scope.widgets.length).toBe(1);
      });
    });
  });
});
