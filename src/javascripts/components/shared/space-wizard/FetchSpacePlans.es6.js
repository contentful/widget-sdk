import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import { getSpaceRatePlans } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {canCreate} from 'utils/ResourceUtils';
import {get} from 'lodash';
import {RequestState} from './WizardUtils';
import logger from 'logger';

const FetchSpacePlans = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    spaceId: PropTypes.string,
    onFetch: PropTypes.func,
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
    const { onFetch } = this.props;

    this.fetch(this.props).then(() => {
      onFetch && onFetch();
    });
  },

  async fetch ({ organization, spaceId }) {
    try {
      const result = await getSpacePlans({ organization, spaceId });

      this.setState({
        ...result,
        requestState: RequestState.SUCCESS,
        error: null
      });
    } catch (e) {
      logger.logError(e);

      this.setState({
        spaceRatePlans: [],
        freeSpacesResource: {limits: {}},
        requestState: RequestState.ERROR,
        error: e
      });
    }
  },

  render () {
    return this.props.children(this.state);
  }
});

async function getSpacePlans ({ organization, spaceId }) {
  const { spaceRatePlans: rawSpaceRatePlans, freeSpacesResource } = await plansMeta({ organization, spaceId });

  const spaceRatePlans = rawSpaceRatePlans.map(plan => {
    let disabled = false;

    if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
      disabled = true;
    } else if (plan.isFree) {
      disabled = !canCreate(freeSpacesResource);
    } else if (!organization.isBillable) {
      disabled = true;
    }

    return { ...plan, disabled };
  });

  return {
    spaceRatePlans,
    freeSpacesResource
  };
}

async function plansMeta ({ organization, spaceId }) {
  const resources = createResourceService(organization.sys.id, 'organization');
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  const [rawSpaceRatePlans, freeSpacesResource] = await Promise.all([
    getSpaceRatePlans(endpoint, spaceId),
    resources.get('free_space')
  ]);


  const spaceRatePlans = rawSpaceRatePlans.map((plan) => {
    const isFree = (plan.productPlanType === 'free_space');
    const includedResources = getIncludedResources(plan.productRatePlanCharges);

    return {...plan, isFree, includedResources};
  });

  return {
    spaceRatePlans,
    freeSpacesResource
  };
}

export const ResourceTypes = {
  Environments: 'Environments',
  Roles: 'Roles',
  Locales: 'Locales',
  ContentTypes: 'Content types',
  Records: 'Records'
};

function getIncludedResources (charges) {
  return Object.values(ResourceTypes).map((value) => ({
    type: value,
    number: get(charges.find(({name}) => name === value), 'tiers[0].endingUnit')
  }));
}

export default FetchSpacePlans;
