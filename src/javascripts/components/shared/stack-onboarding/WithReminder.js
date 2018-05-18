import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'react/with-reminder';

angular.module('contentful')
.factory(moduleName, [function () {
  const WithReminder = createReactClass({
    propTypes: {
      // in ms
      timeout: PropTypes.number,
      children: PropTypes.func.isRequired
    },
    getDefaultProps () {
      return {
        // 5 minutes by default
        timeout: 1000 * 60 * 5
      };
    },
    getInitialState () {
      return {
        showReminder: false
      };
    },
    componentDidMount () {
      this.startCount();
    },
    componentWillUnmount () {
      this.clearCount();
    },
    clearCount () {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    },
    startCount () {
      const { timeout } = this.props;

      this.clearCount();

      this.timer = setTimeout(() => {
        this.setState({ showReminder: true });
      }, timeout);
    },
    render () {
      const { showReminder } = this.state;
      return this.props.children({ showReminder, invalidate: this.startCount });
    }
  });

  return WithReminder;
}]);

export const name = moduleName;
