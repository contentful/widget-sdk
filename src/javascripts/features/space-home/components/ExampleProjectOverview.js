import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  Subheading,
  Typography,
  Paragraph,
  Button,
  TextLink,
  Spinner,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { go } from 'states/Navigator';
import { env } from 'Config';
import qs from 'qs';
import { openDeleteSpaceDialog } from 'features/space-settings';
import * as TokenStore from 'services/TokenStore';
import { trackClickCTA } from '../tracking';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';
import { router } from 'core/react-routing';

const styles = {
  flexContainer: css({ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' }),
  firstChild: css({ width: '319px' }),
  secondChild: css({
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }),
  svgIllustration: css({ height: '300px' }),
  image: css({
    width: '447px',
    height: '307px',
    backgroundSize: '447px 307px',
    marginRight: tokens.spacingXl,
  }),
  spinner: css({ marginLeft: tokens.spacingS, marginBottom: tokens.spacingXl }),
  previewDescription: css({ marginTop: tokens.spacingS }),
  buttonSpacing: css({ marginBottom: tokens.spacingXl }),
};

export const ExampleProjectOverview = ({ cdaToken, cpaToken }) => {
  const { currentOrganization, currentSpaceId } = useSpaceEnvContext();
  const { spaceEnvCMAClient } = useSpaceEnvCMAClient();
  const [isLoading, setLoading] = useState(false);
  const deleteEnabled = isOwnerOrAdmin(currentOrganization);

  const findCourse = (courses) => {
    const course = courses.find((lesson) => {
      const matchSlug = lesson.fields.slug['en-US'] === 'hello-contentful';
      const matchTitle = lesson.fields.title['en-US'] === 'Hello Contentful';
      return matchSlug || matchTitle;
    });
    if (course) {
      return course;
    } else {
      return undefined;
    }
  };

  const modifyEntry = async () => {
    setLoading(true);
    trackClickCTA('create_an_entry_button');

    // get all lesson entries
    const courses = await spaceEnvCMAClient.entry.getMany({
      query: {
        limit: 1000,
        content_type: 'course',
      },
    });

    // find a lesson where we want edit
    const helloCourse = findCourse(courses.items);

    if (helloCourse) {
      go({
        path: ['spaces', 'detail', 'entries', 'detail'],
        params: {
          entryId: helloCourse.sys.id,
        },
      });
    } else {
      router.navigate({ path: 'entries.list' });
    }

    setLoading(false);
  };

  const getPreviewUrl = () => {
    // we can retrieve this URL from content preview or construct it by ourselves
    // there is no direct links to /courses, so it means we'll need to modify some
    // content preview (in the middle). So it is easier just to construct by ourselves
    // TODO: add params and env

    const queryParams = {
      // next params allow to use user's space as a source for the app itself
      // so his changes will be refleced on the app's content
      space_id: currentSpaceId,
      delivery_token: cdaToken,
      preview_token: cpaToken,
      // user will be able to go back to the webapp from TEA using links
      // without this flag, there will be no links in UI of TEA
      editorial_features: 'enabled',
      // we want to have faster feedback for the user after his changes
      // CPA reacts to changes in ~5 seconds, CDA in more than 10
      api: 'cpa',
    };
    const queryString = qs.stringify(queryParams);

    const domain = env === 'production' ? 'contentful' : 'flinkly';
    return `https://the-example-app-nodejs.${domain}.com/courses${
      queryString ? '?' : ''
    }${queryString}`;
  };

  const handleDeleteSpace = async () => {
    const space = await TokenStore.getSpace(currentSpaceId);
    trackClickCTA('example_app:delete_space');

    openDeleteSpaceDialog({
      space,
      onSuccess: () => {
        go({
          path: 'home',
        });
      },
    });
  };

  return (
    <div className={styles.flexContainer}>
      <div className={styles.firstChild}>
        <Typography testId="example-project-card">
          <Subheading>Explore the example project, and education course catalog app</Subheading>
          <Paragraph>
            To view and edit an entry of the course catalog, navigate to the Content tab from the
            top menu.
          </Paragraph>
          <Paragraph>
            In the content tab, you’ll see entries for 2 courses and within them, the lessons that
            make up each course.
          </Paragraph>
          <Subheading>Get started by editing an entry</Subheading>
          <Paragraph>Let&apos;s edit a lesson entry.</Paragraph>
          <Button
            testId="example-project-card.edit-an-entry-button"
            className={styles.buttonSpacing}
            onClick={modifyEntry}>
            Edit an entry
          </Button>
          {isLoading && (
            <Spinner testId="loading-spinner" className={styles.spinner} size="large" />
          )}

          {deleteEnabled && (
            <div data-test-id="delete-space-section">
              <Subheading>Ready to start your own content model?</Subheading>
              <Paragraph>
                To start from scratch, delete this space and then add a new space. Deleting this
                space can’t be undone.
              </Paragraph>
              <Button testId="delete-space-cta" buttonType="negative" onClick={handleDeleteSpace}>
                Delete space
              </Button>
            </div>
          )}
        </Typography>
      </div>
      <div className={styles.secondChild}>
        <div
          role="img"
          aria-label="View of The Example App"
          className={cx(styles.image, 'background-image_tea-template')}
        />
        <Paragraph className={styles.previewDescription}>
          <TextLink
            onClick={() => trackClickCTA('preview_app_link')}
            href={getPreviewUrl()}
            target="_blank"
            rel="noopener noreferrer">
            Preview The Example App
          </TextLink>
        </Paragraph>
      </div>
    </div>
  );
};

ExampleProjectOverview.propTypes = {
  cdaToken: PropTypes.string.isRequired,
  cpaToken: PropTypes.string.isRequired,
};
