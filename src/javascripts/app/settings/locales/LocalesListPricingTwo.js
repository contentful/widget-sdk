import React from 'react';
import PropTypes from 'prop-types';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { Heading, Workbench } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import LocalesListSidebar from './LocalesListSidebar';
import LocalesTable from './LocalesTable';

class LocalesListPricingTwo extends React.Component {
  static propTypes = {
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    allowedToEnforceLimits: PropTypes.bool.isRequired,
    canChangeSpace: PropTypes.bool.isRequired,
    localeResource: PropTypes.object.isRequired,
    insideMasterEnv: PropTypes.bool.isRequired,
    subscriptionState: PropTypes.object.isRequired,
    upgradeSpace: PropTypes.func.isRequired,
  };

  renderTitle() {
    return (
      <>
        <Heading>Locales</Heading>
        <span className="workbench-header__kb-link">
          <KnowledgeBase target="locale" />
        </span>
      </>
    );
  }

  render() {
    return (
      <Workbench testId="locale-list-workbench">
        <Workbench.Header
          icon={<NavigationIcon icon="settings" color="green" size="large" />}
          title={this.renderTitle()}
        />
        <Workbench.Content type="full">
          <LocalesTable locales={this.props.locales} />
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <LocalesListSidebar
            insideMasterEnv={this.props.insideMasterEnv}
            localeResource={this.props.localeResource}
            allowedToEnforceLimits={this.props.allowedToEnforceLimits}
            canChangeSpace={this.props.canChangeSpace}
            subscriptionState={this.props.subscriptionState}
            upgradeSpace={this.props.upgradeSpace}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}

export default LocalesListPricingTwo;
