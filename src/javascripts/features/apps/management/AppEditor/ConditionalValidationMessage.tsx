import { ValidationMessage } from '@contentful/forma-36-react-components';
import { isEqual } from 'lodash';
import React from 'react';
import { ValidationError } from './types';
import { styles } from './styles';

interface Props
  extends Partial<Omit<React.ComponentPropsWithoutRef<typeof ValidationMessage>, 'children'>> {
  errors: ValidationError[];
  path: ValidationError['path'];
}

export function ConditionalValidationMessage({ errors, path, ...messageProps }: Props) {
  const error = errors.find((e) => isEqual(e.path, path));

  if (!error) {
    return null;
  }

  return (
    <ValidationMessage className={styles.fieldTypesValidationMessage} {...messageProps}>
      {error.details}
    </ValidationMessage>
  );
}
