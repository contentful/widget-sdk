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
import { fromWidgetSettings, getRichTextOptions, getWidgetSettings } from './utils/helpers';
import { getUpdatedField } from './utils/getUpdatedField';

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
  richTextSettings: Object;
  richTextIsPristine: boolean;
};

type FormAction =
  | { type: 'blur_field'; form: ContentTypeForm; fieldName: string }
  | {
      type: 'set_content_type_value';
      form: ContentTypeForm;
      fieldName: string;
      fieldValue: unknown;
    }
  | { type: 'set_editor_interface_settings'; form: ContentTypeForm; value: unknown }
  | { type: 'set_richtext_settings'; form: ContentTypeForm; value: Object };

const getFormFieldsAsObject = (fields: Record<string, { value: unknown }>) => {
  return Object.entries(fields).reduce(
    (memo, [fieldName, { value }]) => ({ ...memo, [fieldName]: value }),
    {}
  );
};
const getUpdatedState = (
  state: FormState,
  form: ContentTypeForm,
  fields: Record<string, unknown> = {}
): Partial<FormState> => {
  const combinedFields = {
    ...getFormFieldsAsObject(form.fields),
    ...fields,
  };

  const { updatedField, widgetSettings } = getUpdatedField(
    [combinedFields, state.richTextSettings, state.widgetSettings],
    state.field,
    state.contentType
  );

  const contentType = {
    ...state.contentType,
    fields: state.contentType.fields.map((existingField) =>
      existingField.id === updatedField.id ? updatedField : existingField
    ),
  };

  const editorInterface = {
    ...state.editorInterface,
    controls: state.editorInterface.controls?.map((existingControl) =>
      existingControl.fieldId === state.widget.fieldId ? state.widget : existingControl
    ),
  };

  return {
    field: updatedField,
    widgetSettings,
    contentType,
    editorInterface,
  };
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'blur_field': {
      action.form.onBlur(action.fieldName);

      return state;
    }
    case 'set_content_type_value': {
      action.form.onChange(action.fieldName, action.fieldValue);
      const updatedState = getUpdatedState(state, action.form, {
        [action.fieldName]: action.fieldValue,
      });

      return {
        ...state,
        ...updatedState,
      };
    }
    case 'set_editor_interface_settings': {
      const widgetSettings = action.value as WidgetSettings;
      const widget = {
        ...state.widget,
        ...fromWidgetSettings(widgetSettings),
      };
      const updatedState = getUpdatedState({ ...state, widget, widgetSettings }, action.form);

      return {
        ...state,
        ...updatedState,
        widget,
        widgetIsPristine: false,
      };
    }
    case 'set_richtext_settings': {
      const updatedState = getUpdatedState(
        { ...state, richTextSettings: action.value },
        action.form
      );

      return {
        ...state,
        ...updatedState,
        richTextSettings: action.value,
        richTextIsPristine: false,
      };
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
  const [state, dispatch] = useReducer(formReducer, {}, function lazyInitFormState() {
    // we clone the state to be able to mutate the
    // objects without interfering with parent components

    const isNewField = !contentType.fields.some((existingField) => existingField.id === field.id);
    const state: FormState = {
      widgetIsPristine: true,
      richTextIsPristine: true,
      isNewField,
      contentType: cloneDeep(contentType),
      field: cloneDeep(field),
      editorInterface: cloneDeep(editorInterface),
      widget: cloneDeep(widget),
      widgetSettings: getWidgetSettings(widget),
      richTextSettings: getRichTextOptions(field),
    };

    if (isNewField) {
      state.contentType.fields.push(field);
      state.editorInterface.controls?.push(widget);
    }

    return state;
  });

  return {
    contentType: state.contentType,
    field: state.field,
    editorInterface: state.editorInterface,
    widget: state.widget,
    widgetSettings: state.widgetSettings,
    richTextSettings: state.richTextSettings,
    fields: form.fields,
    blur: (fieldName: string) => dispatch({ type: 'blur_field', form, fieldName }),
    setContentTypeValue: (fieldName: string, fieldValue: unknown) => {
      dispatch({
        type: 'set_content_type_value',
        form,
        fieldName,
        fieldValue,
      });
    },
    setEditorInterfaceSettings: (value: unknown) =>
      dispatch({
        type: 'set_editor_interface_settings',
        form,
        value,
      }),
    setRichTextSettings: (value: Object) =>
      dispatch({
        type: 'set_richtext_settings',
        form,
        value,
      }),
    submit: () => form.onSubmit(state.richTextSettings, state.widgetSettings),
    get isInvalid() {
      return form.form.invalid;
    },
    get isPristine() {
      return (
        !state.isNewField &&
        form.form.pristine &&
        state.widgetIsPristine &&
        state.richTextIsPristine
      );
    },
  };
}
