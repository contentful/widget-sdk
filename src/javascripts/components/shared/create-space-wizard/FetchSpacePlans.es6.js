import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {canCreate} from 'utils/ResourceUtils';
import {get, isNumber} from 'lodash';
import {RequestState} from './WizardUtils';

const FetchSpacePlans = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    onUpdate: PropTypes.func,
    // children is a rendering function
    children: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      error: null,
      spaceRatePlans: [],
      freeSpacesResource: {limits: {}},
      requestState: RequestState.PENDING
    };
  },
  componentDidMount () {
    this.fetch(this.props);
  },
  componentWillReceiveProps (nextProps) {
    if (this.props.organization !== nextProps.organization) {
      this.fetch(nextProps);
    }
  },
  render () {
    return this.props.children(this.state);
  },
  async fetch ({organization}) {
    try {
      const endpoint = createOrganizationEndpoint(organization.sys.id);
      const resourceService = createResourceService(organization.sys.id, 'organization');

      const [freeSpacesResource, rawSpacePlans] = await Promise.all([
        resourceService.get('free_space'),
        getSpaceRatePlans(endpoint)
      ]);

      const spaceRatePlans = rawSpacePlans.map((plan) => {
        const isFree = (plan.productPlanType === 'free_space');
        const includedResources = getIncludedResources(plan.productRatePlanCharges);
        const disabled = isFree ? !canCreate(freeSpacesResource) : !organization.isBillable;

        return {...plan, isFree, includedResources, disabled};
      });

      this.setState({
        spaceRatePlans,
        freeSpacesResource,
        requestState: RequestState.SUCCESS,
        error: null
      });
    } catch (error) {
      this.setState({
        spaceRatePlans: [],
        freeSpacesResource: {limits: {}},
        requestState: RequestState.ERROR,
        error
      });
    }
  },
  componentDidUpdate (...args) {
    if (this.props.onUpdate) { this.props.onUpdate(...args); }
  }
});

const RESOURCE_ORDER = ['Environments', 'Roles', 'Locales', 'Content types', 'Records'];

function getIncludedResources (productRatePlanCharges) {
  return productRatePlanCharges
    .filter(({unitType, tiers}) => (
      unitType === 'limit' && isNumber(get(tiers, '[0].endingUnit'))
    ))
    .map(({name, tiers}) => ({
      name, units: tiers[0].endingUnit
    }))
    .sort((first, second) => (
      RESOURCE_ORDER.indexOf(first.name) > RESOURCE_ORDER.indexOf(second.name)
    ));
}

export default FetchSpacePlans;
