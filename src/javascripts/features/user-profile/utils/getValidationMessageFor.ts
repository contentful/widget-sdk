interface Field {
  value: string;
}

interface Fields {
  firstName?: Field;
  lastName?: Field;
  email?: Field;
  currentPassword?: Field;
  newPassword?: Field;
  newPasswordConfirm?: Field;
}

type Validators = Record<keyof Fields, (field: Field, fields?: Fields) => string | undefined>;

const validations = {
  presence: (value: string) => (value.trim() ? true : false),
  minLength: (length: number, value: string) =>
    value && value.trim().length >= length ? true : false,
  maxLength: (length: number, value: string) =>
    value && value.trim().length < length ? true : false,
};

const validators: Validators = {
  firstName: (field) => {
    const { value } = field;

    if (!validations.presence(value)) {
      return 'First name is required';
    }

    if (!validations.maxLength(100, value)) {
      return 'First name must be less than 100 characters';
    }
  },
  lastName: (field) => {
    const { value } = field;
    if (!validations.presence(value)) {
      return 'Last name is required';
    }

    if (!validations.maxLength(100, value)) {
      return 'Last name must be less than 100 characters';
    }
  },
  email: (field) => {
    const { value } = field;

    if (!validations.presence(value)) {
      return 'Email is required';
    }

    if (!validations.maxLength(254, value)) {
      return 'Email must be less than 254 characters';
    }
  },
  currentPassword: (field) => {
    const { value } = field;

    if (!validations.presence(value)) {
      return 'Current password is required';
    }
  },
  newPassword: (field) => {
    const { value } = field;

    if (!validations.minLength(8, value)) {
      return 'New password must be at least 8 characters';
    }
  },
  newPasswordConfirm: (field, fields) => {
    const { value } = field;

    if (!validations.minLength(8, value)) {
      return 'New password confirmation must be at least 8 characters';
    }

    if (value !== fields?.newPassword?.value) {
      return 'New password and its confirmation do not match';
    }
  },
};

export function getValidationMessageFor(fields: Fields, fieldName: string) {
  const fieldData = fields[fieldName];

  if (!fieldData) {
    return 'Warning: field name is not valid';
  }

  // The server validation message always take precedence over others
  if (fieldData.serverValidationMessage) {
    return fieldData.serverValidationMessage;
  }

  const validator = validators[fieldName];

  if (!validator) {
    return null;
  }

  return validator(fieldData, fields);
}
