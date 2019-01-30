import teaConfig from './teaEditorInterfaces.es6';
import { getModule } from 'NgRegistry.es6';

const environment = getModule('environment');

// we need this id to enrich TEA specifically
const TEA_SPACE_ID = environment.settings.contentful.TEASpaceId;

/**
 * @description We use CDA to get information about template while cloning example spaces
 * So we lose some information:
 * 1. description of content types
 * 2. fields' validations of content types
 * 3. editor interfaces (appearance - e.g. slug editor or url editor)
 *
 * This method enriches specific templates with needed info.
 *
 * @param {object} templateInfo
 * @param {object} template
 * @returns {object} - template with updated content types and editor interfaces
 */
export function enrichTemplate(templateInfo, template) {
  // we enrich only TEA for several reasons:
  // 1. TEA is created by default
  // 2. We plan to retire other templates in the future
  if (templateInfo.spaceId === TEA_SPACE_ID) {
    return enrichTEA(template);
  }

  return template;
}

/**
 * @description - enrich template object with content types descriptions, validations
 * and with editor interfaces
 * We get all this information from the local file. You can read about all possible solutions
 * in this TP ticket - https://contentful.tpondemand.com/entity/27376-add-validations-and-widgets-from-tes
 *
 * In a nutshell, keeping this file locally makes it the least "magical"
 * @param {object} template
 *
 */
function enrichTEA(template) {
  return {
    ...template,
    contentTypes: template.contentTypes.map(contentType => {
      const contentTypeConfig = teaConfig.contentTypes[contentType.sys.id];
      return {
        ...contentType,
        description: contentTypeConfig.description,
        fields: contentType.fields.map(field => ({
          ...field,
          validations: contentTypeConfig.validations[field.id] || []
        }))
      };
    }),
    editorInterfaces: teaConfig.editorInterfaces
  };
}
