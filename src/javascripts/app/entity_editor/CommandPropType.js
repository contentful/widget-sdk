import PropTypes from 'prop-types';

export default PropTypes.shape({
  label: PropTypes.string,
  targetStateId: PropTypes.string,
  execute: PropTypes.func.isRequired,
  isAvailable: PropTypes.func.isRequired,
  isDisabled: PropTypes.func.isRequired,
  inProgress: PropTypes.func.isRequired,
});
