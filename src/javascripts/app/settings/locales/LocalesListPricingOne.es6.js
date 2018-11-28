import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Button, Notification } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import LocalesTable from './LocalesTable.es6';
import StateLink from 'app/common/StateLink.es6';
import LocalesUsageStatus, { getLocalesUsageStatus } from './utils/LocalesUsageStatus.es6';

const LocalesListPropTypes = {
  locales: PropTypes.arrayOf(PropTypes.object).isRequired,
  canCreateMultipleLocales: PropTypes.bool.isRequired,
  canChangeSpace: PropTypes.bool.isRequired,
  localeResource: PropTypes.object.isRequired,
  insideMasterEnv: PropTypes.bool.isRequired,
  subscriptionState: PropTypes.object,
  subscriptionPlanName: PropTypes.string.isRequired,
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired
};

export const AddLocaleButton = ({ getComputeLocalesUsageForOrganization }) => (
  <StateLink to="^.new">
    {({ onClick }) => (
      <Button
        icon="PlusCircle"
        testId="add-locales-button"
        buttonType="primary"
        onClick={() => {
          const usage = getComputeLocalesUsageForOrganization();
          if (usage) {
            Notification.error(usage);
          } else {
            onClick();
          }
        }}>
        Add locale
      </Button>
    )}
  </StateLink>
);
AddLocaleButton.propTypes = {
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired
};

export const LocalesAdvice = props => {
  const {
    localeResource,
    insideMasterEnv,
    subscriptionPlanName,
    canChangeSpace,
    subscriptionState,
    locales,
    canCreateMultipleLocales
  } = props;

  const status = getLocalesUsageStatus({
    canCreateMultipleLocales,
    locales,
    localeResource
  });

  let advice = '';

  const upgradeLink =
    subscriptionState && subscriptionState.path ? (
      <StateLink
        to={subscriptionState.path.join('.')}
        params={subscriptionState.params}
        options={subscriptionState.options}
        className="text-link upgrade-link">
        upgrade
      </StateLink>
    ) : (
      <span>upgrade</span>
    );

  if (status === LocalesUsageStatus.MORE_THAN_ONE_LOCALE_USED || !insideMasterEnv) {
    advice = (
      <div>
        <h1 className="advice__title">
          Contentful enables publishing content in multiple languages
        </h1>
        <p className="advice__description">
          To enable localization, go to the relevant content type, open field settings, and enable
          translation for each necessary field
        </p>
        <p className="advice__description">
          After that the content editor will display multiple input fields for each locale
        </p>
      </div>
    );
  } else if (status === LocalesUsageStatus.ONE_LOCALE_USED) {
    advice = (
      <div>
        <h1 className="advice__title">
          Contentful enables publishing content in multiple languages
        </h1>
        <p className="advice__description">
          To begin translating your content, add a second locale – for example,{' '}
          <strong>
            French (<code>fr-FR</code>)
          </strong>
        </p>
        <p className="advice__description">
          Note that locale settings apply space-wide: the locales that you create will affect only
          the current space
        </p>
      </div>
    );
  } else if (status === LocalesUsageStatus.LOCALES_LIMIT_REACHED) {
    advice = (
      <div>
        <h1 className="advice__title">You have reached the organization locales limit</h1>
        <p className="advice__description">
          Your current subscription plan <strong>({subscriptionPlanName})</strong> enables a maximum
          of {localeResource.limits.maximum} locales per organization
        </p>
        {canChangeSpace && (
          <p className="advice__description">
            Please {upgradeLink} if you need more locales or delete some of the existing ones
          </p>
        )}
        {!canChangeSpace && (
          <p className="advice__description">
            Please ask your organization owner to upgrade if you need more locales or delete some of
            the existing ones
          </p>
        )}
      </div>
    );
  } else if (status === LocalesUsageStatus.NO_MULTIPLE_LOCALES) {
    advice = (
      <div>
        <h1 className="advice__title">Your plan does not include multiple locales</h1>
        <p className="advice__description">
          Your current subscription plan <strong>({subscriptionPlanName})</strong> does not support
          localizing content
        </p>
        {canChangeSpace && (
          <p className="advice__description">
            Please {upgradeLink} to a plan that includes locales to benefit from this feature
          </p>
        )}
        {!canChangeSpace && (
          <p className="advice__description">
            Please ask your organization owner to upgrade to a plan that includes locales to benefit
            from this feature
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="advice locale-list__advice">
      <div className="advice__frame locale-list__advice-frame" data-test-id="locales-advice">
        {advice}
      </div>
    </div>
  );
};

LocalesAdvice.propTypes = LocalesListPropTypes;

class LocalesListPricingOne extends React.Component {
  static propTypes = LocalesListPropTypes;

  render() {
    return (
      <Workbench className="locale-list entity-list">
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>
            Locales
            <span className="workbench-header__kb-link">
              <KnowledgeBase target="locale" />
            </span>
          </Workbench.Title>
          <Workbench.Header.Actions>
            <AddLocaleButton
              getComputeLocalesUsageForOrganization={
                this.props.getComputeLocalesUsageForOrganization
              }
            />
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>
          <LocalesTable locales={this.props.locales} />
          <LocalesAdvice {...this.props} />
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default LocalesListPricingOne;
