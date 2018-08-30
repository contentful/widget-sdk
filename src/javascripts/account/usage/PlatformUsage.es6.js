import * as auth from 'Authentication.es6';
import { apiUrl } from 'Config.es6';
import { createOrganizationEndpoint } from 'data/Endpoint.es6';
import { getBasePlan } from 'account/pricing/PricingDataProvider.es6';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { createElement as h } from 'react';
import { runTask } from 'utils/Concurrent.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { getOrganization } from 'services/TokenStore.es6';
import * as ReloadNotification from 'ReloadNotification';
import { TiersTable } from 'account/pricing/TiersTable.es6';
import Workbench from 'app/WorkbenchReact.es6';

const PlatformUsage = createReactClass({
  propTypes: {
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  getInitialState: function() {
    return {
      charges: []
    };
  },
  componentDidMount: function() {
    return runTask(this.fetchPlan);
  },
  fetchPlan: function*() {
    const { orgId, onReady, onForbidden } = this.props;
    const org = yield getOrganization(orgId);
    const orgEndpoint = createOrganizationEndpoint(apiUrl(), orgId, auth);

    if (!isOwnerOrAdmin(org)) {
      onForbidden();
      return;
    }

    const plan = yield getBasePlan(orgEndpoint).catch(ReloadNotification.apiErrorHandler);

    onReady();
    this.setState({
      name: plan.name,
      charges: plan.ratePlanCharges
        // we only support tiered charges now
        .filter(charge => Array.isArray(charge.tiers))
    });
  },
  render: function() {
    return h(Workbench, {
      title: 'Usage',
      content: h(
        'div',
        { style: { padding: '2rem 3.15rem' } },
        h('h2', { style: { margin: '0 0 1em' } }, this.state.name),
        this.state.charges.map(charge => h(TiersTable, { key: charge.sys.id, charge }))
      ),
      sidebar: h('div', null, '')
    });
  }
});

export default PlatformUsage;
