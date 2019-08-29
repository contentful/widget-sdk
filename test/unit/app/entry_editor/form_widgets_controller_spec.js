import _ from 'lodash';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('FormWidgetsController#widgets', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    $inject('mocks/spaceContext').init();
    this.scope = $inject('$rootScope').$new();

    this.scope.editorContext = $inject('mocks/entityEditor/Context').create();
    this.scope.contentType = { getId: _.constant('ctid') };
    this.scope.preferences = {};
    this.scope.localeData = {};
    this.field = {
      id: 'foo',
      apiName: 'foo'
    };

    const controls = [
      {
        widgetId: 'foo',
        fieldId: 'foo',
        field: this.field
      }
    ];

    this.createController = function() {
      const $controller = $inject('$controller');
      $controller('FormWidgetsController', { $scope: this.scope, controls });
      $apply();
    };
  });

  it('exposes enabled field', function() {
    this.createController();
    expect(this.scope.widgets.length).toBe(1);
  });

  describe('when the single-locale mode is on', function() {
    beforeEach(function() {
      this.scope.localeData.isSingleLocaleModeOn = true;
    });

    describe('and the focused locale is the default locale', function() {
      beforeEach(function() {
        this.scope.localeData.focusedLocale = { internal_code: 'en' };
        this.scope.localeData.defaultLocale = { internal_code: 'en' };
      });

      describe('and the field is disabled', function() {
        beforeEach(function() {
          this.field.disabled = true;
          this.scope.preferences.showDisabledFields = false;
          this.createController();
        });

        it('does not show the field', function() {
          expect(this.scope.widgets.length).toBe(0);
        });

        describe('and the preference flag is set', function() {
          beforeEach(function() {
            this.scope.preferences.showDisabledFields = true;
          });

          it('shows the fields if the preference flag is set', function() {
            $apply();
            expect(this.scope.widgets.length).toBe(1);
          });
        });

        describe('and the field has errors', function() {
          beforeEach(function() {
            this.validator = this.scope.editorContext.validator;
            this.validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
          });

          it('shows the field', function() {
            this.validator.errors$.set([]);
            expect(this.scope.widgets.length).toBe(1);
          });
        });
      });
    });

    describe('and the focused locale is not the default locale', function() {
      beforeEach(function() {
        this.scope.localeData.defaultLocale = { internal_code: 'en' };
        this.scope.localeData.focusedLocale = { internal_code: 'de' };
      });

      describe('and the field is not localized', function() {
        beforeEach(function() {
          this.field.localized = false;
          this.createController();
          this.field.disabled = false;
          this.scope.preferences.showDisabledFields = true;
          const validator = this.scope.editorContext.validator;
          validator.hasFieldError.withArgs('foo').returns(true);
          validator.errors$.set([]);
        });

        it('does not show the field', function() {
          $apply();
          expect(this.scope.widgets.length).toBe(0);
        });

        describe('and the field locale has errors', function() {
          beforeEach(function() {
            this.validator = this.scope.editorContext.validator;
            this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
          });

          it('shows the field', function() {
            this.validator.errors$.set([]);
            expect(this.scope.widgets.length).toBe(1);
          });
        });
      });

      describe('and the field is localized', function() {
        beforeEach(function() {
          this.field.localized = true;
          this.createController();
        });

        it('shows the field', function() {
          expect(this.scope.widgets.length).toBe(1);
        });

        describe('and the field is disabled', function() {
          beforeEach(function() {
            this.field.disabled = true;
            this.createController();
          });

          it('does not show the field', function() {
            $apply();
            expect(this.scope.widgets.length).toBe(0);
          });

          describe('and the preference field is set', function() {
            beforeEach(function() {
              this.scope.preferences.showDisabledFields = true;
            });

            it('shows the field', function() {
              $apply();
              expect(this.scope.widgets.length).toBe(1);
            });
          });

          describe('and the field locale has errors', function() {
            beforeEach(function() {
              this.validator = this.scope.editorContext.validator;
              this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
            });

            it('shows the field', function() {
              this.validator.errors$.set([]);
              expect(this.scope.widgets.length).toBe(1);
            });
          });

          describe('and the field locale does not have errors', function() {
            beforeEach(function() {
              this.validator = this.scope.editorContext.validator;
              this.validator.hasFieldError.withArgs('foo').returns(true);
              this.validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
              this.validator.hasFieldLocaleError.withArgs('foo', 'de').returns(false);
            });

            it('does not show the field', function() {
              this.validator.errors$.set([]);
              expect(this.scope.widgets.length).toBe(0);
            });
          });
        });
      });
    });
  });

  describe('when the multi-locale mode is on', function() {
    beforeEach(function() {
      this.scope.localeData.isSingleLocaleModeOn = false;
    });

    describe('and the field is disabled', function() {
      beforeEach(function() {
        this.field.disabled = true;
        this.createController();
      });

      it('does not show the field', function() {
        $apply();
        expect(this.scope.widgets.length).toBe(0);
      });

      it('shows the fields if the preference flag is set', function() {
        this.scope.preferences.showDisabledFields = true;
        $apply();
        expect(this.scope.widgets.length).toBe(1);
      });

      it('shows the field if it has errors', function() {
        const validator = this.scope.editorContext.validator;
        validator.hasFieldError.withArgs('foo').returns(true);
        validator.errors$.set([]);
        expect(this.scope.widgets.length).toBe(1);
      });
    });
  });
});
