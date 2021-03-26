import { ValidationError } from './types';
import { isEmpty } from 'lodash';
import { EMPTY_SPACE_REG_EXP, SRC_REG_EXP } from './constants';
import { WidgetLocation } from '@contentful/widget-renderer';

export function validate(definition, errorPath: string[] = []) {
  const errors: ValidationError[] = [];

  if (isEmpty(definition.name)) {
    errors.push({
      path: [...errorPath, 'name'],
      details: 'Please enter an app name',
    });
  }

  if (!isEmpty(definition.src) && !SRC_REG_EXP.test(definition.src)) {
    errors.push({
      path: [...errorPath, 'src'],
      details: 'Please enter a valid URL',
    });
  }

  const entryFieldLocation = definition.locations.find(
    (l) => l.location === WidgetLocation.ENTRY_FIELD
  );
  if (entryFieldLocation && (entryFieldLocation.fieldTypes ?? []).length === 0) {
    errors.push({
      path: [...errorPath, 'locations', 'entry-field', 'fieldTypes'],
      details: 'Please select at least one field type',
    });
  }

  const pageLocation = definition.locations.find((l) => l.location === WidgetLocation.PAGE);
  if (pageLocation?.navigationItem) {
    if (isEmpty(pageLocation.navigationItem.name)) {
      errors.push({
        path: [...errorPath, 'locations', 'page', 'navigationItem', 'name'],
        details: 'Please enter a link name',
      });
    }

    if (
      !pageLocation?.navigationItem.path.startsWith('/') ||
      EMPTY_SPACE_REG_EXP.test(pageLocation?.navigationItem.path)
    ) {
      errors.push({
        path: [...errorPath, 'locations', 'page', 'navigationItem', 'path'],
        details: 'Please enter a path which starts with / and does not contain empty space',
      });
    }
  }

  return errors;
}
