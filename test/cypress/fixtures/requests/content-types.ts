import { Matchers } from '@pact-foundation/pact-web';
import { cloneDeep } from 'lodash';
const severalContentTypesBody = require('../responses/content-types-several.json');
const editorInterfaceWithoutSidebarResponseBody = require('../responses/editor-interface-without-sidebar.json');

const defaultContentType = severalContentTypesBody.items[0];

export const createReguestWithNewField = ({ name, apiName, type, linkType, validations }) => {
  const newField = {
    name,
    apiName,
    type,
    linkType,
    id: Matchers.string(),
    validations: validations,
  };
  const contentType = cloneDeep(defaultContentType);

  contentType.fields.push(newField);
  return contentType;
};

export const createResponseWithNewField = ({ name, apiName, type, linkType, validations }) => {
  const newField = {
    name,
    apiName,
    type,
    linkType,
    id: 'pGKCEEBPbMDHwO69',
    localized: false,
    required: false,
    validations: validations || [],
    disabled: false,
    omitted: false,
  };
  const contentType = cloneDeep(defaultContentType);

  contentType.fields.push(newField);
  return contentType;
};

export const createEditorInterfaceRequestWithNewField = ({ apiName, widgetId }) => {
  const request = cloneDeep(editorInterfaceWithoutSidebarResponseBody);
  const control = {
    fieldId: apiName,
    widgetId,
    widgetNamespace: 'builtin',
  };
  request.controls.push(control);
  return request;
};
