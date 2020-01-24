import moment from 'moment';
import PropTypes from 'prop-types';

const formatTime = (time, size) =>
  moment
    .utc(time)
    .local()
    .format(size === 'default' ? 'ddd, DD MMM YYYY [at] h:mm A' : 'MMM Do, YYYY - h:mm A');

const FormattedTime = ({ time, size }) => formatTime(time, size);

FormattedTime.propTypes = {
  time: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['default', 'small'])
};

FormattedTime.defaultProps = {
  size: 'default'
};

export { formatTime };

export default FormattedTime;
