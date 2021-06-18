import { decorateFieldValidations, decorateNodeValidations, validate } from './validationDecorator';
import { map, reject, camelCase, inRange, find } from 'lodash';

export const getSettingsFormFields = (ctField, contentType) => {
  return {
    name: {
      value: ctField.name,
      required: true,
      validator: (value) => {
        if (inRange(value.length, 1, 50)) {
          return undefined;
        } else {
          return "Please edit the text so it's between 1 and 50 characters long";
        }
      },
    },
    apiName: {
      value: ctField.apiName,
      required: true,
      validator: (value) => {
        if (!value.match(/^[a-zA-Z0-9_]+$/) || value.length === 0) {
          return 'Please use only letters and numbers';
        } else if (value.match(/^\d/)) {
          return 'Please use a letter as the first character';
        } else if (!isApiNameUnique(value, contentType)) {
          return 'A field with this ID already exists';
        } else {
          return undefined;
        }
      },
    },
    localized: { value: ctField.localized },
    isTitle: { value: contentType.displayField === ctField.id },
    required: { value: ctField.required },
  };
};

function isApiNameUnique(field, contentType) {
  const otherFields = reject(contentType.fields, { id: field.id });
  const apiNames = map(otherFields, 'apiName');
  return apiNames.indexOf(field.apiName) < 0;
}

export const getValidationsFormFields = (ctField) => {
  const fieldValidations = decorateFieldValidations(ctField);
  return fieldValidations.reduce(
    (acc, validation) => ({
      ...acc,
      [validation.type]: {
        value: { ...validation, currentView: getInitialView(validation) },
        validator: (value) => {
          const error = validate(value)
            .map((error) => error.message)
            .join(', ');
          // validationDecorator.validate returns empty array or array of errors
          // TODO: update later to return expected error format from validationDecorator
          if (error === '') {
            return undefined;
          } else {
            return error;
          }
        },
      },
    }),
    {}
  );
};

function getInitialView(validation) {
  const type = validation.type;
  const settings = validation.settings;
  if (type === 'size' || type === 'range' || type === 'assetFileSize') {
    const hasMin = typeof settings?.min === 'number';
    const hasMax = typeof settings?.max === 'number';
    if (hasMin && hasMax) {
      return 'min-max';
    }
    if (hasMin) {
      return 'min';
    }
    if (hasMax) {
      return 'max';
    }
  } else if (type === 'regexp') {
    const view = find(validation.views, (view) => view.pattern === settings.pattern);
    if (view) {
      return view.name;
    } else {
      return 'custom';
    }
  }

  return validation.currentView;
}

export const getNodeValidationsFormFields = (ctField) => {
  if (ctField.type !== 'RichText') {
    return undefined;
  }
  const validation = ctField.validations && ctField.validations.find((val) => val.nodes);
  const nodeValidations = decorateNodeValidations(validation ? validation.nodes : {})
    .map((i) => i.validations)
    .flat();

  return nodeValidations.reduce(
    (acc, validation) => ({
      ...acc,
      [camelCase(`${validation.nodeType}-${validation.type}`)]: {
        value: validation,
        validator: (value) => {
          const error = validate(value)
            .map((error) => error.message)
            .join(', ');
          // validationDecorator.validate returns empty array or array of errors
          // TODO: update later to return expected error format from validationDecorator
          if (error === '') {
            return undefined;
          } else {
            return error;
          }
        },
      },
    }),
    {}
  );
};

export const getInitialValueFormFields = (ctField) => {
  return {
    initialValue: {
      value: ctField.initialValue,
    },
  };
};
