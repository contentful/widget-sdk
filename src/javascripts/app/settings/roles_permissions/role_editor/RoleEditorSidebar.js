import React from 'react';
import PropTypes from 'prop-types';
import { Paragraph, Typography } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';

export default function RoleEditorSidebar(props) {
  const { hasCustomRolesFeature, isLegacy } = props;

  if (hasCustomRolesFeature) {
    return (
      <>
        <WorkbenchSidebarItem title="Learn more">
          <Paragraph>
            To create or customize a role, such as a translator for a specific language, read the
            documentation on{' '}
            <KnowledgeBase
              target="roles"
              text="custom roles and permissions"
              inlineText
              icon={false}
            />
            .
          </Paragraph>
        </WorkbenchSidebarItem>
        <WorkbenchSidebarItem title="Hint from our staff">
          <div className="staff-hint">
            <i className="fa fa-quote-left" />
            <div className="staff-hint__quote">
              <div className="staff-hint__content">
                Anything that is not explicitly allowed, is&nbsp;denied.
              </div>
              <div className="staff-hint__author">
                <div className="staff-hint__author-photo" />
                <div className="staff-hint__authr-name">
                  <strong>Hervé Labas</strong>
                  <Paragraph>Group Product manager at Contentful</Paragraph>
                </div>
              </div>
            </div>
          </div>
        </WorkbenchSidebarItem>
      </>
    );
  }

  return (
    <>
      <WorkbenchSidebarItem title="Customize your roles">
        {isLegacy ? (
          <Paragraph>
            With our Enterprise Plans it is possible to fully customize the roles within your space.
            These custom roles can define granular permissions on entries, content types, and
            fields. To learn more about what’s possible check out{' '}
            <KnowledgeBase target="roles" text="this guide " /> or{' '}
            <ContactUsButton buttonType="link">
              <span>get in touch</span>
            </ContactUsButton>{' '}
            with our Enterprise team.
          </Paragraph>
        ) : (
          <Typography>
            <Paragraph>
              With our more advanced spaces it&apos;s possible to fully edit and customize the roles
              within your space.
            </Paragraph>
            <Paragraph>
              These Custom Roles can be defined to have granular permissions on entries, content
              types, fields, and more.
            </Paragraph>
            <Paragraph>
              To learn more about what&apos;s possible, check out{' '}
              <KnowledgeBase target="roles" text="our guide to Roles and Permissions " />.
            </Paragraph>
            <ContactUsButton buttonType="link" />
          </Typography>
        )}
      </WorkbenchSidebarItem>
    </>
  );
}

RoleEditorSidebar.propTypes = {
  hasCustomRolesFeature: PropTypes.bool,
  isLegacy: PropTypes.bool
};
