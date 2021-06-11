import constate from 'constate';
import keyBy from 'lodash/keyBy';
import type { ContentType, ContentTypeField, EditorInterface } from 'core/typings';

type FieldDialogProps = {
  field: ContentTypeField;
  contentType: ContentType;
  editorInterface: EditorInterface;
};

const useFieldDialog = (props: FieldDialogProps) => {
  const { field, contentType, editorInterface } = props;
  // const instance = editorInterface.controls?.find((c) => c.field.apiName === field.apiName);
  const instance = field.apiName
    ? keyBy(editorInterface.controls, 'fieldId')[field.apiName]
    : undefined;

  return {
    field,
    instance,
    contentType,
    editorInterface,
  };
};

const [FieldDialogProvider, useFieldDialogContext] = constate(useFieldDialog);

export { FieldDialogProvider, useFieldDialogContext };
