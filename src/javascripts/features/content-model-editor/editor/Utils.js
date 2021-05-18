import { cloneDeep } from 'lodash';
import { go } from 'states/Navigator';
import { syncControls } from 'widgets/EditorInterfaceTransformer';
import { openCreateContentTypeDialog } from './Dialogs';

export const allFieldsInactive = (contentType) => {
  const fields = contentType.fields || [];
  return fields.every((field) => field.disabled || field.omitted);
};

export const goToDetails = (contentType) => {
  // X.detail.fields -> X.detail.fields with altered contentTypeId param
  return go({ path: '^.^.detail.fields', params: { contentTypeId: contentType.sys.id } });
};

export const getWidget = (field, contentType, controls) => {
  const updatedContentType = cloneDeep(contentType);
  updatedContentType.fields = [...updatedContentType.fields, field];
  const syncedControls = syncControls(updatedContentType, controls);
  return syncedControls.find((control) => {
    return control.fieldId === (field.apiName || field.id);
  });
};

export const openCreateDialog = async (contentTypeIds, contentType, setContentType) => {
  openCreateContentTypeDialog(contentTypeIds).then(
    (result) => {
      if (result) {
        const clonedCT = cloneDeep({ sys: {}, fields: [], ...contentType });
        clonedCT.name = result.name;
        clonedCT.description = result.description;
        clonedCT.sys.id = result.contentTypeId;
        if (result.assembly) {
          // Add assembly to request only if value is present
          clonedCT.assembly = result.assembly;
        }
        setContentType(clonedCT);
      } else {
        // X.detail.fields -> X.list
        go({ path: 'spaces.detail.content_types.list' });
      }
    },
    () => {}
  );
};
