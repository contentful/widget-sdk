import React from 'react';
import PropTypes from 'prop-types';
import ContactUsButton from '../ui/Components/ContactUsButton.es6';
import KnowledgeBase from '../components/shared/knowledge_base_icon/KnowledgeBase.es6';

export default class CustomRolesPlanInfo extends React.Component {
  static propTypes = {
    isLegacy: PropTypes.bool
  };

  static defaultProps = {
    isLegacy: false
  };

  render() {
    const { isLegacy } = this.props;

    return (
      <React.Fragment>
        <h2 className="entity-sidebar__heading">Customize your roles</h2>
        {isLegacy ? (
          <p>
            With our Enterprise Plans it is possible to fully customize the roles within your space.
            These custom roles can define granular permissions on entries, content types, and
            fields. To learn more about what’s possible check out{' '}
            <KnowledgeBase target="roles" text="this guide " /> or{' '}
            <ContactUsButton buttonType="link">
              <span>get in touch</span>
            </ContactUsButton>{' '}
            with our Enterprise team.
          </p>
        ) : (
          <React.Fragment>
            <p>
              With our more advanced spaces it&apos;s possible to fully edit and customize the roles
              within your space.
            </p>
            <p>
              These Custom Roles can be defined to have granular permissions on entries, content
              types, fields, and more.
            </p>
            <p>
              To learn more about what&apos;s possible, check out{' '}
              <KnowledgeBase target="roles" text="our guide to Roles and Permissions " />.
            </p>
            <ContactUsButton buttonType="link" />
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
