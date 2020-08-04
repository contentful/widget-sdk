import PropTypes from 'prop-types';

export const FormFieldsType = {
  name: PropTypes.object.isRequired,
  apiName: PropTypes.object.isRequired,
  localized: PropTypes.object.isRequired,
  isTitle: PropTypes.object.isRequired,
  required: PropTypes.object.isRequired,
  unique: PropTypes.object,
  size: PropTypes.object,
  regexp: PropTypes.object,
  prohibitRegexp: PropTypes.object,
  in: PropTypes.object,
};

export const ValidationFieldType = {
  value: PropTypes.shape({
    name: PropTypes.string,
    helpText: PropTypes.string,
    type: PropTypes.string,
    onItems: PropTypes.bool,
    enabled: PropTypes.bool,
    message: PropTypes.string,
    settings: PropTypes.any,
    views: PropTypes.array,
    currentView: PropTypes.string,
  }).isRequired,
  validator: PropTypes.func.isRequired,
  blurred: PropTypes.bool,
  error: PropTypes.string,
  errorType: PropTypes.string,
};
