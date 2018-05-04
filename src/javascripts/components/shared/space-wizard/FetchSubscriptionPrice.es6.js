import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSubscriptionPlans, calculateTotalPrice} from 'account/pricing/PricingDataProvider';
import {RequestState} from './WizardUtils';
import logger from 'logger';

const FetchSubscriptionPrice = createReactClass({
  propTypes: {
    organizationId: PropTypes.string.isRequired,
    onUpdate: PropTypes.func,
    // children is a rendering function
    children: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      totalPrice: 0,
      error: null,
      requestState: RequestState.PENDING
    };
  },
  componentDidMount () {
    this.fetch();
  },
  render () {
    return this.props.children(this.state);
  },
  async fetch () {
    try {
      const endpoint = createOrganizationEndpoint(this.props.organizationId);
      const plans = await getSubscriptionPlans(endpoint);
      const totalPrice = calculateTotalPrice(plans.items);
      this.setState({
        totalPrice,
        requestState: RequestState.SUCCESS,
        error: null
      });
    } catch (error) {
      logger.logError(error);

      this.setState({
        totalPrice: 0,
        requestState: RequestState.ERROR,
        error
      });
    }
  },
  componentDidUpdate (...args) {
    if (this.props.onUpdate) { this.props.onUpdate(...args); }
  }
});

export default FetchSubscriptionPrice;
