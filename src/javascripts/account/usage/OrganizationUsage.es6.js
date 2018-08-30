import React from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy } from 'lodash/fp';

import { Spinner } from '@contentful/ui-component-library';

import * as ReloadNotification from 'ReloadNotification.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository.es6';
import { isEnterprisePlan, getBasePlan } from 'account/pricing/PricingDataProvider.es6';
import createResourceService from 'services/ResourceService.es6';
import { getOrganization } from 'services/TokenStore.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import Workbench from 'app/WorkbenchReact.es6';

import OrganizationResourceUsageList from './non_commited/OrganizationResourceUsageList.es6';
import OrganizationUsagePage from './commited/OrganizationUsagePage.es6';
import { getPeriods, getOrgUsage, getApiUsage } from './commited/randomData.es6';
import PeriodSelector from './commited/PeriodSelector.es6';

export default class OrganizationUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };

    this.setPeriodIndex = this.setPeriodIndex.bind(this);
  }

  async componentDidMount() {
    const { onForbidden } = this.props;

    await this.checkPermissions();
    try {
      await this.fetchOrgData();
    } catch (ex) {
      onForbidden(ex);
    }
  }

  async checkPermissions() {
    const { orgId } = this.props;
    const organization = await getOrganization(orgId);

    if (!isOwnerOrAdmin(organization)) {
      throw new Error('No permission');
    }
  }

  async fetchOrgData() {
    const { orgId, onReady } = this.props;
    const endpoint = createOrganizationEndpoint(orgId);
    const service = createResourceService(orgId, 'organization');

    try {
      const basePlan = await getBasePlan(endpoint);
      const commited = isEnterprisePlan(basePlan);

      if (commited) {
        const [
          spaces,
          periods,
          {
            limits: { included: includedLimit }
          }
        ] = await Promise.all([
          getAllSpaces(endpoint),
          getPeriods(orgId),
          service.get('api_request')
        ]);
        const spaceNames = flow(
          keyBy('sys.id'),
          mapValues('name')
        )(spaces);
        this.setState({ spaceNames, periods: periods.items, includedLimit });
        await this.loadPeriodData(0);
      } else {
        this.setState({ resources: await service.getAll() });
      }

      this.setState({ commited }, onReady);
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  }

  async loadPeriodData(newIndex) {
    const { orgId } = this.props;
    const { periods } = this.state;
    const {
      sys: { id: periodId }
    } = periods[newIndex];
    const [org, cma, cda, cpa] = await Promise.all([
      getOrgUsage(orgId, periodId),
      ...['cma', 'cda', 'cpa'].map(api => getApiUsage(orgId, periodId, api))
    ]);

    this.setState({
      loading: false,
      usage: { org, apis: { cma, cda, cpa } },
      selectedPeriodIndex: newIndex
    });
  }

  async setPeriodIndex(e) {
    this.setState({ loading: true });
    await this.loadPeriodData(parseInt(e.target.value));
  }

  render() {
    const {
      spaceNames,
      selectedPeriodIndex,
      loading,
      periods,
      includedLimit,
      usage,
      commited,
      resources
    } = this.state;
    return (
      <Workbench
        icon="page-usage"
        testId="organization.usage"
        title="Usage"
        actions={
          commited ? (
            !loading && periods ? (
              <PeriodSelector
                periods={periods}
                selectedPeriodIndex={selectedPeriodIndex}
                onChange={this.setPeriodIndex}
              />
            ) : (
              <Spinner />
            )
          ) : (
            undefined
          )
        }
        content={
          commited ? (
            typeof selectedPeriodIndex !== 'undefined' ? (
              <OrganizationUsagePage
                period={periods[selectedPeriodIndex]}
                spaceNames={spaceNames}
                usage={usage}
                includedLimit={includedLimit}
              />
            ) : (
              <div />
            )
          ) : typeof resources !== 'undefined' ? (
            <OrganizationResourceUsageList resources={resources} />
          ) : (
            <div />
          )
        }
      />
    );
  }
}
