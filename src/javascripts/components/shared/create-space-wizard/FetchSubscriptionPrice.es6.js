import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSubscriptionPlans, calculateTotalPrice} from 'account/pricing/PricingDataProvider';
import {RequestState} from './WizardUtils';

const FetchSubscriptionPrice = createReactClass({
  propTypes: {
    organizationId: PropTypes.string.isRequired,
    // children is a rendering function
    children: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      totalPrice: 0,
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
      this.setState({
        totalPrice: 0,
        requestState: RequestState.ERROR,
        error
      });
    }
  }
});

export default FetchSubscriptionPrice;
