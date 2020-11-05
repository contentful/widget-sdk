import { createEditorContextMock } from '../../../../test/utils/createEditorContextMock';
import { filterWidgets } from './formWidgetsController';

const enLocale = { internal_code: 'en', code: 'en' };
const deLocale = { internal_code: 'de', code: 'de' };

let editorContext;
let localeData;
let field;
let showDisabledFields;

const filter = () => {
  const controlsForm = [
    {
      widgetId: 'foo',
      fieldId: 'foo',
      field,
    },
  ];

  return filterWidgets(localeData, editorContext, controlsForm, showDisabledFields);
};

describe('FormWidgetsController#widgets', () => {
  beforeEach(async () => {
    editorContext = createEditorContextMock().create();
    localeData = {
      defaultLocale: enLocale,
      privateLocales: [enLocale, deLocale],
    };
    field = {
      id: 'foo',
      apiName: 'foo',
      localized: true,
    };
    showDisabledFields = false;
  });

  it('exposes enabled field', () => {
    const widgets = filter();
    expect(widgets).toHaveLength(1);
  });

  describe('when the single-locale mode is on', () => {
    beforeEach(() => {
      localeData.isSingleLocaleModeOn = true;
    });

    describe('and the focused locale is the default locale', () => {
      beforeEach(() => {
        localeData.focusedLocale = enLocale;
      });

      describe('and the field is disabled', () => {
        beforeEach(() => {
          field.disabled = true;
          showDisabledFields = false;
        });

        it('does not show the field', () => {
          const widgets = filter();
          expect(widgets).toHaveLength(0);
        });

        describe('and the preference flag is set', () => {
          beforeEach(() => {
            showDisabledFields = true;
          });

          it('shows the fields if the preference flag is set', () => {
            const widgets = filter();
            expect(widgets).toHaveLength(1);
          });
        });

        describe('and the field has errors', () => {
          let validator;
          beforeEach(() => {
            validator = editorContext.validator;
            validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
          });

          it('shows the field', () => {
            validator.errors$.set([]);
            const widgets = filter();
            expect(widgets).toHaveLength(1);
          });
        });
      });
    });

    describe('and the focused locale is not the default locale', () => {
      beforeEach(() => {
        localeData.focusedLocale = deLocale;
      });

      describe('and the field is not localized', () => {
        beforeEach(() => {
          field.localized = false;
          field.disabled = false;
          showDisabledFields = true;
          const validator = editorContext.validator;
          validator.hasFieldError.withArgs('foo').returns(true);
          validator.errors$.set([]);
        });

        it('does not show the field', () => {
          const widgets = filter();
          expect(widgets).toHaveLength(0);
        });

        describe('and the field locale has errors', () => {
          let validator;
          beforeEach(() => {
            validator = editorContext.validator;
            validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
          });

          it('shows the field', () => {
            validator.errors$.set([]);
            const widgets = filter();
            expect(widgets).toHaveLength(1);
          });
        });
      });

      describe('and the field is localized', () => {
        beforeEach(() => {
          field.localized = true;
        });

        it('shows the field', () => {
          const widgets = filter();
          expect(widgets).toHaveLength(1);
        });

        describe('and the field is disabled', () => {
          beforeEach(() => {
            field.disabled = true;
          });

          it('does not show the field', () => {
            const widgets = filter();
            expect(widgets).toHaveLength(0);
          });

          describe('and the preference field is set', () => {
            beforeEach(() => {
              showDisabledFields = true;
            });

            it('shows the field', () => {
              const widgets = filter();
              expect(widgets).toHaveLength(1);
            });
          });

          describe('and the field locale has errors', () => {
            let validator;
            beforeEach(() => {
              validator = editorContext.validator;
              validator.hasFieldLocaleError.withArgs('foo', 'de').returns(true);
            });

            it('shows the field', () => {
              validator.errors$.set([]);
              const widgets = filter();
              expect(widgets).toHaveLength(1);
            });
          });

          describe('and the field locale does not have errors', () => {
            let validator;
            beforeEach(() => {
              validator = editorContext.validator;
              validator.hasFieldError.withArgs('foo').returns(true);
              validator.hasFieldLocaleError.withArgs('foo', 'en').returns(true);
              validator.hasFieldLocaleError.withArgs('foo', 'de').returns(false);
            });

            it('does not show the field', () => {
              validator.errors$.set([]);
              const widgets = filter();
              expect(widgets).toHaveLength(0);
            });
          });
        });
      });
    });
  });

  describe('when the multi-locale mode is on', () => {
    beforeEach(() => {
      localeData.isSingleLocaleModeOn = false;
    });

    describe('and the field is disabled', () => {
      beforeEach(() => {
        field.disabled = true;
      });

      it('does not show the field', () => {
        const widgets = filter();
        expect(widgets).toHaveLength(0);
      });

      it('shows the fields if the preference flag is set', () => {
        showDisabledFields = true;
        const widgets = filter();
        expect(widgets).toHaveLength(1);
      });

      it('shows the field if it has errors', () => {
        const validator = editorContext.validator;
        validator.hasFieldError.withArgs('foo').returns(true);
        validator.errors$.set([]);
        const widgets = filter();

        expect(widgets).toHaveLength(1);
      });
    });
  });
});
