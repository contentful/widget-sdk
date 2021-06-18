import { isNull, pickBy, get } from 'lodash';
import { capitalize, joinWithAnd } from 'utils/StringUtils';
import { richTextOptionsLabels } from './validationDecorator';

const areSettingsEmpty = (settings) =>
  isNull(settings) || (isNull(settings?.min) && isNull(settings?.max));

export const rangeTypes = {
  MIN: 'min',
  MAX: 'max',
  MIN_MAX: 'min-max',
};

export const extractRichTextNodesValidations = (fields) => {
  const nodes = {};
  Object.values(fields).forEach((field) => {
    if (areSettingsEmpty(field.settings) || !field.enabled) {
      return;
    }
    const validation = {};
    validation[field.type] = field.settings;
    validation.message = field.message;
    if (nodes[field.nodeType]) {
      nodes[field.nodeType].push(validation);
    } else {
      nodes[field.nodeType] = [validation];
    }
  });
  return { nodes };
};

export const getRichTextOptions = (ctField) => {
  const validationsForEnabledNodeTypesOrMarks =
    ctField.validations &&
    ctField.validations.filter((value) => {
      return value.enabledNodeTypes || value.enabledMarks;
    });
  return Object.assign({}, ...(validationsForEnabledNodeTypesOrMarks || []));
};

const makeMessage = (kindPlural, enabledTypes) => {
  const list = joinWithAnd(enabledTypes.map((name) => richTextOptionsLabels[name]));
  return list.length > 0
    ? `Only ${list} ${kindPlural} are allowed`
    : `${capitalize(kindPlural)} are not allowed`;
};

export const getEnabledRichTextOptions = (options) => {
  const optionsValidations = [];
  if (options.enabledMarks) {
    optionsValidations.push({
      enabledMarks: options.enabledMarks,
      message: makeMessage('marks', options.enabledMarks),
    });
  }
  if (options.enabledNodeTypes) {
    optionsValidations.push({
      enabledNodeTypes: options.enabledNodeTypes,
      message: makeMessage('nodes', options.enabledNodeTypes),
    });
  }
  return optionsValidations;
};

export const fromWidgetSettings = (settings) => {
  return {
    widgetId: settings.id,
    widgetNamespace: settings.namespace,
    settings: settings.params,
  };
};

export const getWidgetSettings = (widget) => {
  return {
    id: get(widget, 'widgetId'),
    namespace: get(widget, 'widgetNamespace'),
    params: Object.assign({}, get(widget, 'settings')),
  };
};

export const groupValidations = (validations) => {
  const itemValidations = pickBy(validations, (validation) => validation.onItems);
  const baseValidations = pickBy(validations, (validation) => !validation.onItems);
  return { itemValidations, baseValidations };
};
