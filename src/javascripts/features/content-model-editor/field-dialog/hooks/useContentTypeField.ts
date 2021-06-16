import { useCallback, useMemo, useState } from 'react';
import { getWidgetSettings } from '../utils/helpers';
import { useForm } from 'core/hooks';
import {
  getInitialValueFormFields,
  getNodeValidationsFormFields,
  getSettingsFormFields,
  getValidationsFormFields,
} from '../utils/formFieldDefinitions';
import { ContentType, ContentTypeField, EditorInterfaceControl } from 'core/typings';

type ContentTypeFieldProps = {
  contentType: ContentType;
  field: ContentTypeField;
  submitFn: Function;
  widget: EditorInterfaceControl;
};

function useWidgetSettings(widget) {
  const [data, setData] = useState(() => getWidgetSettings(widget));
  const [pristine, setPristine] = useState(true);
  const setActualData = useCallback((newData) => {
    setData(newData);
    setPristine(false);
  }, []);

  return {
    pristine,
    data,
    setData: setActualData,
  };
}

export function useContentTypeField({
  submitFn,
  contentType,
  field,
  widget,
}: ContentTypeFieldProps) {
  const widgetSettings = useWidgetSettings(widget);
  const form = useForm({
    fields: {
      ...getSettingsFormFields(field, contentType),
      ...getValidationsFormFields(field),
      ...getNodeValidationsFormFields(field),
      ...getInitialValueFormFields(field),
    },
    submitFn,
  });

  return useMemo(
    () => ({
      contentType: form,
      widgetSettings: {
        data: widgetSettings.data,
        setData: widgetSettings.setData,
      },
      get isInvalid() {
        return form.form.invalid;
      },
      get isPristine() {
        return form.form.pristine && widgetSettings.pristine;
      },
    }),
    [form, widgetSettings]
  );
}
