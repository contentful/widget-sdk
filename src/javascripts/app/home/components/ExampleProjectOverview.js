import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  Subheading,
  Typography,
  Paragraph,
  Button,
  TextLink,
  Spinner
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getModule } from 'NgRegistry';
import { go } from 'states/Navigator';
import { env } from 'Config';
import qs from 'qs';
import { trackClickCTA } from '../tracking';

const styles = {
  flexContainer: css({ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' }),
  firstChild: css({ width: '319px' }),
  secondChild: css({ textAlign: 'center' }),
  svgIllustration: css({ height: '300px' }),
  image: css({
    width: '447px',
    height: '307px',
    backgroundSize: '447px 307px',
    marginRight: tokens.spacingXl
  }),
  spinner: css({ marginLeft: tokens.spacingS }),
  previewDescription: css({ marginTop: tokens.spacingS })
};
const ExampleProjectOverview = ({ cdaToken, cpaToken }) => {
  const spaceContext = getModule('spaceContext');
  const [isLoading, setLoading] = useState(false);

  const findCourse = courses => {
    const course = courses.find(lesson => {
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

  // const createNewLessonCopy = () => {
  //   return entityCreator.newEntry('lessonCopy');
  // };

  const modifyEntry = async () => {
    setLoading(true);
    trackClickCTA('create_an_entry_button');

    // get all lesson entries
    const courses = await spaceContext.cma.getEntries({
      content_type: 'course'
    });

    // find a lesson where we want edit
    const helloCourse = findCourse(courses.items);

    if (helloCourse) {
      go({
        path: ['spaces', 'detail', 'entries', 'detail'],
        params: {
          entryId: helloCourse.sys.id
        }
      });
    } else {
      go({
        path: ['spaces', 'detail', 'entries', 'list']
      });
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
      space_id: spaceContext.space.getId(),
      delivery_token: cdaToken,
      preview_token: cpaToken,
      // user will be able to go back to the webapp from TEA using links
      // without this flag, there will be no links in UI of TEA
      editorial_features: 'enabled',
      // we want to have faster feedback for the user after his changes
      // CPA reacts to changes in ~5 seconds, CDA in more than 10
      api: 'cpa'
    };
    const queryString = qs.stringify(queryParams);

    const domain = env === 'production' ? 'contentful' : 'flinkly';
    return `https://the-example-app-nodejs.${domain}.com/courses${
      queryString ? '?' : ''
    }${queryString}`;
  };

  return (
    <div className={styles.flexContainer}>
      <div className={styles.firstChild}>
        <Typography>
          <Subheading>The Example Project is an educational course catalog app</Subheading>
          <Paragraph>
            To view the entries of the course catalog, explore the content tab from the main
            navigation.
          </Paragraph>
          <Paragraph>
            In the content tab, you’ll see entries for two courses and the lessons that make up each
            course.
          </Paragraph>
          <Subheading>Get started by modifying content</Subheading>
          <Paragraph>Try modifying the title of a lesson entry.</Paragraph>
          <Button onClick={modifyEntry}>Modify an entry</Button>
          {isLoading && <Spinner className={styles.spinner} size="large" />}
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
            target={'_blank'}
            rel={'noopener noreferrer'}>
            Preview The Example App
          </TextLink>
        </Paragraph>
      </div>
    </div>
  );
};

ExampleProjectOverview.propTypes = {
  cdaToken: PropTypes.string.isRequired,
  cpaToken: PropTypes.string.isRequired
};

export default ExampleProjectOverview;
