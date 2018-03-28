import { h } from 'ui/Framework';
import { container, hspace, hbox, vbox } from 'ui/Layout';
import { asReact } from 'ui/Framework/DOMRenderer';
import createReactClass from 'create-react-class';
import { caseof } from 'libs/sum-types';

import { byName as colors } from 'Styles/Colors';
import { oneLineTruncate } from 'Styles';
import logo from 'svg/logo-label';
import environmentIcon from 'svg/environment';
import hamburger from 'svg/hamburger';

import { navState$, NavStates } from 'navigation/NavState';

const Trigger = createReactClass({
  componentWillMount () {
    this.offNavState = navState$.onValue((navState) => {
      this.setState({ navState });
    });
  },
  componentWillUnmount () {
    this.offNavState();
  },
  render () {
    return asReact(h('.app-top-bar__sidepanel-trigger', {
      dataTestId: 'sidepanel-trigger'
    }, [
      logo,
      hspace('15px'),
      vbox({
        justifyContent: 'center',
        alignSelf: 'stretch',
        flexGrow: '1',
        flexShrink: '1',
        overflow: 'hidden'
      }, renderContent(this.state)),
      hspace('15px'),
      hamburger({ fill: 'white' })
    ]));
  }
});

export default function () {
  return h(Trigger);
}

function renderContent ({ navState }) {
  return caseof(navState, [
    [NavStates.Space, ({ space, env, org, availableEnvironments }) => {
      const showEnvironments =
        space.spaceMembership.admin &&
        availableEnvironments && availableEnvironments.length > 1;
      return [
        organizationName(org.name),
        stateTitle(space.name),
        showEnvironments && environmentLabel(env)
      ];
    }],
    [NavStates.OrgSettings, ({ org }) => [
      organizationName(org.name),
      stateTitle('Organization settings')
    ]],
    [NavStates.NewOrg, () => [ stateTitle('Create new organization') ]],
    [NavStates.UserProfile, () => [ stateTitle('User profile') ]],
    [NavStates.Default, () => [ stateTitle('Welcome to Contentful') ]]
  ]);
}

function stateTitle (title) {
  return h('div', {
    dataTestId: 'sidepanel-trigger-text-title',
    style: {
      ...oneLineTruncate,
      color: '#fff',
      fontSize: '14px',
      lineHeight: '1.3'
    }
  }, [ title ]);
}

function organizationName (orgName) {
  return h('div', {
    dataTestId: 'sidepanel-trigger-text-subtitle',
    style: {
      ...oneLineTruncate,
      color: colors.textLight,
      fontSize: '12px',
      lineHeight: '1.5'
    }
  }, [ orgName ]);
}

function environmentLabel (env) {
  // TODO The 'Space' nav state should always have an environment
  const envId = env ? env.sys.id : 'master';
  const isMaster = envId === 'master';
  return hbox({
    alignItems: 'center',
    fontSize: '12px',
    lineHeight: '1.5',
    color: isMaster ? colors.greenLight : colors.orangeLight
  }, [
    environmentIcon({
      display: 'block',
      flexShrink: 0,
      fill: 'currentColor'
    }),
    hspace('7px'),
    container({
      ...oneLineTruncate
    }, [ envId ])
  ]);
}
