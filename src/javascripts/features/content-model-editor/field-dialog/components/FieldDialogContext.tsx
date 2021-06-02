import constate from 'constate';

type FieldDialogProps = {
  field: any;
  contentType: any;
  editorInterface: any;
};

const useFieldDialog = (props: FieldDialogProps) => {
  const { field, contentType, editorInterface } = props;
  const instance = editorInterface.controls.find((c) => c.field.apiName === field.apiName);

  return {
    field,
    instance,
    contentType,
    editorInterface,
  };
};

const [FieldDialogProvider, useFieldDialogContext] = constate(useFieldDialog);

export { FieldDialogProvider, useFieldDialogContext };
