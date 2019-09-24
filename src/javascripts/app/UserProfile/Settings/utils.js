const validations = {
  presence: value => (value ? true : false),
  minLength: (length, value) => (value && value.length >= length ? true : false)
};

const validators = {
  firstName: value => {
    if (!validations.presence(value)) {
      return 'First name cannot be empty';
    }
  },
  lastName: value => {
    if (!validations.presence(value)) {
      return 'Last name cannot be empty';
    }
  },
  email: value => {
    if (!validations.presence(value)) {
      return 'Email cannot be empty';
    }
  },
  currentPassword: (value, fields) => {
    if (!fields.email.value) {
      return null;
    }

    if (!validations.presence(value)) {
      return 'Current password cannot be empty';
    }
  },
  newPassword: value => {
    if (!validations.minLength(8, value)) {
      return 'New password must be at least 8 characters';
    }
  },
  newPasswordConfirm: (value, fields) => {
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

  if (!fieldData.dirty) {
    return null;
  }

  if (fieldData.serverValidationMessage) {
    return fieldData.serverValidationMessage;
  }

  return validators[fieldName](fieldData.value, fields);
}
