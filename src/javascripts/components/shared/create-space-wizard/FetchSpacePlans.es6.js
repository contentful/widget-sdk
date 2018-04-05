import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {canCreate} from 'utils/ResourceUtils';
import {get, isNumber} from 'lodash';

const FetchSpacePlans = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    renderProgress: PropTypes.func.isRequired,
    renderData: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      spaceRatePlans: [],
      freeSpacesResource: {limits: {}},
      isLoading: true
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
    const {renderProgress, renderData} = this.props;
    return this.state.isLoading ? renderProgress() : renderData(this.state);
  },
  async fetch ({organization}) {
    const resourceService = createResourceService(organization.sys.id, 'organization');
    const freeSpacesResource = await resourceService.get('free_space');

    const endpoint = createOrganizationEndpoint(organization.sys.id);
    const rawSpacePlans = await getSpaceRatePlans(endpoint);

    const spaceRatePlans = rawSpacePlans.map((plan) => {
      const isFree = (plan.productPlanType === 'free_space');
      const includedResources = getIncludedResources(plan.productRatePlanCharges);
      const disabled = isFree ? !canCreate(freeSpacesResource) : !organization.isBillable;

      return {...plan, isFree, includedResources, disabled};
    });

    this.setState({spaceRatePlans, freeSpacesResource, isLoading: false});
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
