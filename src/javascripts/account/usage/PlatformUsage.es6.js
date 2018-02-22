import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {createOrganizationEndpoint} from 'data/Endpoint';
import {getBasePlan} from 'account/pricing/PricingDataProvider';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {createElement as h} from 'libs/react';
import {runTask} from 'utils/Concurrent';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import {getOrganization} from 'services/TokenStore';
import * as ReloadNotification from 'ReloadNotification';
import {TiersTable} from 'account/pricing/TiersTable';

const PlatformUsage = createReactClass({
  propTypes: {
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  getInitialState: function () {
    return {
      charges: []
    };
  },
  componentDidMount: function () {
    return runTask(this.fetchPlan);
  },
  fetchPlan: function* () {
    const {orgId, onReady, onForbidden} = this.props;
    const org = yield getOrganization(orgId);
    const orgEndpoint = createOrganizationEndpoint(apiUrl(), orgId, auth);

    if (!isOwnerOrAdmin(org)) {
      onForbidden();
      return;
    }

    const plan = yield getBasePlan(orgEndpoint)
      .catch(ReloadNotification.apiErrorHandler);

    onReady();
    this.setState({
      name: plan.name,
      charges: plan.ratePlanCharges
        // we only support tiered charges now
        .filter(charge => Array.isArray(charge.tiers))
    });
  },
  render: function () {
    return h(Workbench, {
      title: 'Usage',
      content: h('div', {style: {padding: '2rem 3.15rem'}},
        h('h2', {style: {margin: '0 0 1em'}}, this.state.name),
        this.state.charges.map(charge => h(TiersTable, {key: charge.sys.id, charge}))
      )
    });
  }
});

// TODO: move this to Workbench.es6.js?
function Workbench ({title, content, sidebar}) {
  return h('div', {
    className: 'workbench'
  },
    h('div', {
      className: 'workbench-header__wrapper'
    },
      h('header', {
        className: 'workbench-header'
      },
        h('h1', {
          className: 'workbench-header__title'
        }, title)
      )
    ),
    h('div', {
      className: 'workbench-main'
    },
      h('div', {
        className: 'workbench-main__content'
      }, content),
      h('div', {
        className: 'workbench-main__sidebar'
      }, sidebar)
    )
  );
}

export default PlatformUsage;
