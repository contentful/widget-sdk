import { getModule } from 'NgRegistry.es6';
import constants from './constants.es6';
import { hasVariationContainerInFieldLinkValidations } from './ReferenceField.es6';

import { fetchExtension } from 'app/settings/extensions/dialogs/GitHubFetcher.es6';
import * as Random from 'utils/Random.es6';
import { createContentTypeView } from 'data/UiConfig/Defaults.es6';

const spaceContext = getModule('spaceContext');

function createContentType() {
  return spaceContext.cma.updateContentType({
    sys: {
      id: constants.VARIATION_CONTAINER_CT_ID
    },
    name: 'Variation Container',
    displayField: 'experimentTitle',
    fields: [
      { id: 'experimentTitle', name: 'Experiment title', type: 'Symbol' },
      { id: 'experimentId', name: 'Experiment ID', type: 'Symbol' },
      { id: 'meta', name: 'Meta', type: 'Object' },
      {
        id: 'variations',
        name: 'Variations',
        type: 'Array',
        items: { type: 'Link', linkType: 'Entry' }
      }
    ]
  });
}

function updateEditorInterface(ei, uie) {
  return spaceContext.cma.updateEditorInterface({
    sys: {
      contentType: { sys: { id: constants.VARIATION_CONTAINER_CT_ID } },
      version: ei.sys.version
    },
    controls: ei.controls,
    sidebar: [
      {
        widgetId: uie.sys.id,
        widgetNamespace: 'extension'
      },
      {
        widgetId: 'publication-widget',
        widgetNamespace: 'sidebar-builtin'
      },
      {
        widgetId: 'content-preview-widget',
        widgetNamespace: 'sidebar-builtin'
      }
    ],
    editor: {
      widgetId: uie.sys.id,
      widgetNamespace: 'extension'
    }
  });
}

async function createSavedView() {
  const view = createContentTypeView(constants.VARIATION_CONTAINER_CT_ID, 'Optimizely experiments');

  try {
    const uiConfig = await spaceContext.uiConfig;
    return uiConfig.addToDefault(view);
  } catch (err) {
    /* Creating a saved view is not critical and we don't report if it fails */
  }
}

export async function create(optimizelyProjectId) {
  const [_ct, uie] = await Promise.all([createContentType(), fetchExtension(constants.UIE_GH_URL)]);

  const [createdUie, ei] = await Promise.all([
    spaceContext.cma.createExtension({
      sys: { id: `optimizely-app-${Random.id()}` },
      extension: { ...uie, name: 'Optimizely App' },
      parameters: { optimizelyProjectId }
    }),
    spaceContext.cma.getEditorInterface(constants.VARIATION_CONTAINER_CT_ID)
  ]);

  await Promise.all([updateEditorInterface(ei, createdUie), createSavedView()]);

  return createdUie.sys.id;
}

export async function updateUiExtension(extensionId, optimizelyProjectId) {
  const uie = await spaceContext.cma.getExtension(extensionId);

  return spaceContext.cma.updateExtension({
    ...uie,
    parameters: { optimizelyProjectId }
  });
}

export function updateContentTypes(contentTypes, referenceFieldsMap) {
  return Promise.all(contentTypes.map(id => updateContentTypeById(id, referenceFieldsMap[id])));
}

export async function updateContentTypeById(contentTypeId, referenceFields) {
  const contentType = await spaceContext.cma.getContentType(contentTypeId);

  contentType.fields.forEach(field => {
    updateReferenceField(field, referenceFields);
  });

  return spaceContext.cma.updateContentType(contentType);
}

export function updateReferenceField(field, referenceFields) {
  if (referenceFields[field.id] && !hasVariationContainerInFieldLinkValidations(field)) {
    return addValidationToReferenceField(field);
  }

  if (!referenceFields[field.id] && hasVariationContainerInFieldLinkValidations(field)) {
    return removeValidationFromReferenceField(field);
  }
}

export function addValidationToReferenceField(field) {
  const validations = (field.items && field.items.validations) || field.validations;
  const linkContentTypeIndex = findLinkContentTypeValidationIndex(validations);

  if (linkContentTypeIndex === -1) {
    validations.push({ linkContentType: [constants.VARIATION_CONTAINER_CT_ID] });
  } else {
    validations[linkContentTypeIndex].linkContentType.push(constants.VARIATION_CONTAINER_CT_ID);
  }
}

export function removeValidationFromReferenceField(field) {
  const validations = (field.items && field.items.validations) || field.validations;
  const linkContentTypeIndex = findLinkContentTypeValidationIndex(validations);

  const variationContainerIndex = validations[linkContentTypeIndex].linkContentType.indexOf(
    constants.VARIATION_CONTAINER_CT_ID
  );

  validations[linkContentTypeIndex].linkContentType.splice(variationContainerIndex, 1);
}

export function removeFromContentTypes(contentTypes) {
  return Promise.all(contentTypes.map(id => removeFromReferenceFields(id)));
}

export async function removeFromReferenceFields(contentTypeId) {
  const contentType = await spaceContext.cma.getContentType(contentTypeId);

  contentType.fields.forEach(field => {
    if (!hasVariationContainerInFieldLinkValidations(field)) {
      return;
    }

    const validations = (field.items && field.items.validations) || field.validations;

    const linkContentTypeIndex = findLinkContentTypeValidationIndex(validations);
    const variationContainerIndex = validations[linkContentTypeIndex].linkContentType.indexOf(
      constants.VARIATION_CONTAINER_CT_ID
    );

    validations[linkContentTypeIndex].linkContentType.splice(variationContainerIndex, 1);
  });

  return spaceContext.cma.updateContentType(contentType);
}

function findLinkContentTypeValidationIndex(validations) {
  let result = -1;

  validations.find((v, i) => {
    if (v.linkContentType) {
      result = i;
      return true;
    }
  });

  return result;
}
