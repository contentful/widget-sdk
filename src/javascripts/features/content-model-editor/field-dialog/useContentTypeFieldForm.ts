import { useCallback, useReducer } from 'react';
import { useForm } from 'core/hooks';
import {
  getInitialValueFormFields,
  getNodeValidationsFormFields,
  getSettingsFormFields,
  getValidationsFormFields,
} from './utils/formFieldDefinitions';
import {
  ContentType,
  ContentTypeField,
  EditorInterface,
  EditorInterfaceControl,
} from 'core/typings';
import cloneDeep from 'lodash/cloneDeep';
import { fromWidgetSettings, getWidgetSettings } from './utils/helpers';

type ContentTypeFieldFormProps = {
  contentType: ContentType;
  field: ContentTypeField;
  editorInterface: EditorInterface;
  widget: EditorInterfaceControl;
  updateField: Function;
  onClose: Function;
};

type ContentTypeForm = ReturnType<typeof useForm>;

type WidgetSettings = ReturnType<typeof getWidgetSettings>;
type FormState = {
  isNewField: boolean;
  contentType: ContentType;
  field: ContentTypeField;
  editorInterface: EditorInterface;
  widget: EditorInterfaceControl;
  widgetSettings: WidgetSettings;
  widgetIsPristine: boolean;
};

type FormEntity = 'content_type' | 'editor_interface';

type FormAction =
  | { type: 'blur_field'; form: ContentTypeForm; entity: FormEntity; fieldName: string }
  | {
      type: 'set_value';
      form: ContentTypeForm;
      entity: FormEntity;
      fieldName: string;
      fieldValue: unknown;
    };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'blur_field': {
      if (action.entity === 'content_type') {
        action.form.onBlur(action.fieldName);
      }

      return state;
    }
    case 'set_value': {
      if (action.entity === 'content_type') {
        action.form.onChange(action.fieldName, action.fieldValue);

        const field = {
          ...state.field,
          [action.fieldName]: action.fieldValue,
        };
        const contentType = {
          ...state.contentType,
          fields: state.contentType.fields.map((existingField) =>
            existingField.id === field.id ? field : existingField
          ),
        };

        return {
          ...state,
          contentType,
          field,
        };
      }

      if (action.entity === 'editor_interface') {
        const widgetSettings = action.fieldValue as WidgetSettings;
        const widget = {
          ...state.widget,
          ...fromWidgetSettings(widgetSettings),
        };
        const editorInterface = {
          ...state.editorInterface,
          controls: state.editorInterface.controls?.map((existingControl) =>
            existingControl.fieldId === widget.fieldId ? widget : existingControl
          ),
        };

        return {
          ...state,
          editorInterface,
          widgetSettings,
          widget,
          widgetIsPristine: false,
        };
      }

      return state;
    }
  }
};

export function useContentTypeFieldForm(props: ContentTypeFieldFormProps) {
  const { contentType, field, editorInterface, widget, updateField, onClose } = props;
  const submitFn = useCallback(
    (values, richTextOptions, widgetSettings) => {
      updateField(values, richTextOptions, widgetSettings);
      onClose();
    },
    [updateField, onClose]
  );
  const form = useForm({
    fields: {
      ...getSettingsFormFields(field, contentType),
      ...getValidationsFormFields(field),
      ...getNodeValidationsFormFields(field),
      ...getInitialValueFormFields(field),
    },
    submitFn,
  });
  const [state, dispatch] = useReducer(
    formReducer,
    {
      isNewField: false,
      contentType,
      field,
      editorInterface,
      widget,
      widgetSettings: {
        id: undefined,
        namespace: undefined,
        params: {},
      },
      widgetIsPristine: true,
    },
    function lazyInitFormState(initialState: FormState) {
      // we clone the state to be able to mutate the
      // objects without interfering with parent components

      const isNewField = !contentType.fields.some((existingField) => existingField.id === field.id);
      const state: FormState = {
        isNewField,
        contentType: cloneDeep(initialState.contentType),
        field: cloneDeep(initialState.field),
        editorInterface: cloneDeep(initialState.editorInterface),
        widget: cloneDeep(initialState.widget),
        widgetSettings: getWidgetSettings(widget),
        widgetIsPristine: initialState.widgetIsPristine,
      };

      if (isNewField) {
        state.contentType.fields.push(field);
        state.editorInterface.controls?.push(widget);
      }

      return state;
    }
  );

  return {
    contentType: state.contentType,
    field: state.field,
    editorInterface: state.editorInterface,
    widget: state.widget,
    widgetSettings: state.widgetSettings,
    fields: form.fields,
    blur: (entity: FormEntity, fieldName: string) =>
      dispatch({ type: 'blur_field', form, entity, fieldName }),
    setValue: (entity: FormEntity, fieldName: string, fieldValue: any) =>
      dispatch({
        type: 'set_value',
        form,
        entity,
        fieldName,
        fieldValue,
      }),
    submit: form.onSubmit,
    get isInvalid() {
      return form.form.invalid;
    },
    get isPristine() {
      return form.form.pristine && state.widgetIsPristine;
    },
  };
}
