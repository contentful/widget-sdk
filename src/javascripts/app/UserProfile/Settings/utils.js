const validations = {
  presence: value => (value ? true : false),
  minLength: (length, value) => (value && value.length >= length ? true : false)
};

const validators = {
  firstName: field => {
    const { value } = field;

    if (!validations.presence(value)) {
      return 'First name is required';
    }
  },
  lastName: field => {
    const { value } = field;
    if (!validations.presence(value)) {
      return 'Last name is required';
    }
  },
  email: field => {
    const { value } = field;
    if (!validations.presence(value)) {
      return 'Email is required';
    }
  },
  currentPassword: (field, fields) => {
    const { value, dirty } = field;
    if (!dirty) {
      return null;
    }

    if (!fields.email.value) {
      return null;
    }

    if (!validations.presence(value)) {
      return 'Current password is required';
    }
  },
  newPassword: field => {
    const { value, dirty } = field;

    if (!dirty) {
      return null;
    }

    if (!validations.minLength(8, value)) {
      return 'New password must be at least 8 characters';
    }
  },
  newPasswordConfirm: (field, fields) => {
    const { value, dirty } = field;

    if (!dirty) {
      return null;
    }

    if (!validations.minLength(8, value)) {
      return 'New password confirmation must be at least 8 characters';
    }

    if (value !== fields.newPassword.value) {
      return 'New password and its confirmation do not match';
    }
  }
};

export function getValidationMessageFor(fields, fieldName) {
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
