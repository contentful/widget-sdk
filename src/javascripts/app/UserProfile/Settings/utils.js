const validations = {
  presence: value => (value.trim() ? true : false),
  minLength: (length, value) => (value && value.trim().length >= length ? true : false)
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
  currentPassword: field => {
    const { value, touched, dirty } = field;

    if (!(touched && dirty)) {
      return null;
    }

    if (!validations.presence(value)) {
      return 'Current password is required';
    }
  },
  newPassword: field => {
    const { value, touched, dirty } = field;

    if (!(touched && dirty)) {
      return null;
    }

    if (!value) {
      return;
    }

    if (!validations.minLength(8, value)) {
      return 'New password must be at least 8 characters';
    }
  },
  newPasswordConfirm: (field, fields) => {
    const { value, touched, dirty } = field;

    if (!(touched && dirty)) {
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
