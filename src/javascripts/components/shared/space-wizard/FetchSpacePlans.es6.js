import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import { getSpaceRatePlans, getSpaceRatePlansForSpace } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {canCreate} from 'utils/ResourceUtils';
import {get} from 'lodash';
import {RequestState} from './WizardUtils';
import logger from 'logger';

const FetchSpacePlans = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    spaceId: PropTypes.string,
    action: PropTypes.string.isRequired,
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
  async fetch ({ organization, spaceId, action }) {
    let getter;

    if (action === 'create') {
      getter = getSpacePlansForCreate;
    } else if (action === 'change') {
      getter = getSpacePlansForChange;
    }

    try {
      const result = await getter({ organization, spaceId });

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
  componentDidUpdate (...args) {
    if (this.props.onUpdate) { this.props.onUpdate(...args); }
  }
});

async function getSpacePlansForCreate ({ organization }) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const plansGetter = getSpaceRatePlans.bind(this, endpoint);

  const { spaceRatePlans: rawSpaceRatePlans, freeSpacesResource } = await plansMeta({ getter: plansGetter, organization });

  const spaceRatePlans = rawSpaceRatePlans.map(plan => {
    const disabled = plan.isFree ? !canCreate(freeSpacesResource) : !organization.isBillable;

    return { ...plan, disabled };
  });

  return {
    spaceRatePlans,
    freeSpacesResource
  };
}

async function getSpacePlansForChange ({ organization, spaceId }) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const getter = getSpaceRatePlansForSpace.bind(this, endpoint, spaceId);

  const { spaceRatePlans: rawSpaceRatePlans, freeSpacesResource } = await plansMeta({ getter, organization });

  const spaceRatePlans = rawSpaceRatePlans.map(plan => {
    const disabled = plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0;

    return { ...plan, disabled };
  });

  return {
    spaceRatePlans,
    freeSpacesResource
  };
}

async function plansMeta ({ getter, organization }) {
  const resources = createResourceService(organization.sys.id, 'organization');

  const [rawSpaceRatePlans, freeSpacesResource] = await Promise.all([
    getter(),
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
