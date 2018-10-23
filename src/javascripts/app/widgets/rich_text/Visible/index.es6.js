import PropTypes from 'prop-types';

/**
 * <Visible /> renders children depending on the value of the prop if.
 * Can be used in case if expressions like `{true && expression}` or `{false && expression}`
 * create to much noise that harms readabillity.
 */
const Visible = props => {
  if (props.if) {
    return props.children;
  }
  return null;
};

Visible.propTypes = {
  if: PropTypes.bool
};

export default Visible;
