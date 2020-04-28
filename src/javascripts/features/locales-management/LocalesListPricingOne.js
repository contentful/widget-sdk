import React from 'react';
import PropTypes from 'prop-types';
import NavigationIcon from 'ui/Components/NavigationIcon';
import _ from 'lodash';
import {
  Button,
  Notification,
  Heading,
  Paragraph,
  Workbench,
} from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { LocalesTable } from './LocalesTable';
import StateLink from 'app/common/StateLink';
import { LocalesUsageStatus, getLocalesUsageStatus } from './utils/LocalesUsageStatus';

const LocalesListPropTypes = {
  locales: PropTypes.arrayOf(PropTypes.object).isRequired,
  canCreateMultipleLocales: PropTypes.bool.isRequired,
  canChangeSpace: PropTypes.bool.isRequired,
  localeResource: PropTypes.object.isRequired,
  insideMasterEnv: PropTypes.bool.isRequired,
  subscriptionState: PropTypes.object,
  subscriptionPlanName: PropTypes.string.isRequired,
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired,
};

export const AddLocaleButton = ({ getComputeLocalesUsageForOrganization }) => (
  <StateLink path="^.new">
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
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired,
};

export const LocalesAdvice = (props) => {
  const {
    localeResource,
    insideMasterEnv,
    subscriptionPlanName,
    canChangeSpace,
    subscriptionState,
    locales,
    canCreateMultipleLocales,
  } = props;

  const status = getLocalesUsageStatus({
    canCreateMultipleLocales,
    locales,
    localeResource,
  });

  let advice = '';

  const upgradeLink =
    subscriptionState && subscriptionState.path ? (
      <StateLink
        path={subscriptionState.path.join('.')}
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
        <Heading className="advice__title">
          Contentful enables publishing content in multiple languages
        </Heading>
        <Paragraph className="advice__description">
          To enable localization, go to the relevant content type, open field settings, and enable
          translation for each necessary field
        </Paragraph>
        <Paragraph className="advice__description">
          After that the content editor will display multiple input fields for each locale
        </Paragraph>
      </div>
    );
  } else if (status === LocalesUsageStatus.ONE_LOCALE_USED) {
    advice = (
      <div>
        <Heading className="advice__title">
          Contentful enables publishing content in multiple languages
        </Heading>
        <Paragraph className="advice__description">
          To begin translating your content, add a second locale – for example,{' '}
          <strong>
            French (<code>fr-FR</code>)
          </strong>
        </Paragraph>
        <Paragraph className="advice__description">
          Note that locale settings apply space-wide: the locales that you create will affect only
          the current space
        </Paragraph>
      </div>
    );
  } else if (status === LocalesUsageStatus.LOCALES_LIMIT_REACHED) {
    advice = (
      <div>
        <Heading className="advice__title">You have reached the organization locales limit</Heading>
        <Paragraph className="advice__description">
          Your current subscription plan <strong>({subscriptionPlanName})</strong> enables a maximum
          of {localeResource.parent.limits.maximum} locales per organization
        </Paragraph>
        {canChangeSpace && (
          <Paragraph className="advice__description">
            Please {upgradeLink} if you need more locales or delete some of the existing ones
          </Paragraph>
        )}
        {!canChangeSpace && (
          <Paragraph className="advice__description">
            Please ask your organization owner to upgrade if you need more locales or delete some of
            the existing ones
          </Paragraph>
        )}
      </div>
    );
  } else if (status === LocalesUsageStatus.NO_MULTIPLE_LOCALES) {
    advice = (
      <div>
        <Heading className="advice__title">Your plan does not include multiple locales</Heading>
        <Paragraph className="advice__description">
          Your current subscription plan <strong>({subscriptionPlanName})</strong> does not support
          localizing content
        </Paragraph>
        {canChangeSpace && (
          <Paragraph className="advice__description">
            Please {upgradeLink} to a plan that includes locales to benefit from this feature
          </Paragraph>
        )}
        {!canChangeSpace && (
          <Paragraph className="advice__description">
            Please ask your organization owner to upgrade to a plan that includes locales to benefit
            from this feature
          </Paragraph>
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

export class LocalesListPricingOne extends React.Component {
  static propTypes = LocalesListPropTypes;

  render() {
    return (
      <Workbench testId="locale-list-workbench">
        <Workbench.Header
          icon={<NavigationIcon icon="settings" color="green" size="large" />}
          title={
            <>
              <Heading>Locales</Heading>
              <span className="workbench-header__kb-link">
                <KnowledgeBase target="locale" />
              </span>
            </>
          }
          actions={
            <AddLocaleButton
              getComputeLocalesUsageForOrganization={
                this.props.getComputeLocalesUsageForOrganization
              }
            />
          }
        />
        <Workbench.Content type="full">
          <LocalesTable locales={this.props.locales} />
          <LocalesAdvice {...this.props} />
        </Workbench.Content>
      </Workbench>
    );
  }
}
