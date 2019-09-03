import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Paragraph, Typography } from '@contentful/forma-36-react-components';
import { href } from 'states/Navigator.es6';
import { getUser } from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';
import { trackClickCTA } from 'app/home/tracking.es6';

import Code from 'components/shared/stack-onboarding/components/Code.es6';
import ExternalTextLink from 'app/common/ExternalTextLink.es6';

import { env } from 'Config.es6';

const styles = {
  flexContainer: css({ display: 'flex', justifyContent: 'space-between' }),
  textColumn: css({ width: '493px' }),
  image: css({
    width: '266px',
    height: '201px',
    backgroundSize: '266px 201px',
    marginRight: tokens.spacingXl,
    marginTop: tokens.spacingXl
  })
};

const ModifyContentDrawer = props => {
  const { managementToken, entry, spaceId } = props;

  const { firstName, lastName } = getUser();
  const updatedFields = {
    ...entry.fields,
    name: {
      'en-US': `${firstName} ${lastName}`
    }
  };

  const domain = env === 'production' ? 'contentful' : 'flinkly';
  const commonSnippetChunk = `curl -X PUT -H 'Authorization: Bearer ${managementToken}'`;

  let modifyContentCurlSnippet = `${commonSnippetChunk}`;
  modifyContentCurlSnippet += ` -H 'X-Contentful-Version: ${entry.sys.version}'`;
  modifyContentCurlSnippet += " -H 'Content-Type: application/vnd.contentful.management.v1+json'";
  modifyContentCurlSnippet += " -H 'X-Contentful-Content-Type: person'";
  modifyContentCurlSnippet += ` --data-binary '{"fields":${JSON.stringify(updatedFields)}}'`;
  modifyContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${entry.sys.id}`;

  let publishContentCurlSnippet = `${commonSnippetChunk}`;
  publishContentCurlSnippet += ` -H 'X-Contentful-Version: ${entry.sys.version + 1}'`;
  publishContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${entry.sys.id}/published\n`;

  // replace single quotes with double because windows doesn't seem to like
  // single quotes very much and errors when you paste and run the snippets in cmd
  const curlSnippets = [modifyContentCurlSnippet, publishContentCurlSnippet].map(snippet =>
    snippet.replace(/"/g, '\\"').replace(/'/g, '"')
  );

  const personEntry = {
    path: ['spaces', 'detail', 'entries', 'detail'],
    params: { spaceId, entryId: entry.sys.id }
  };

  const onCopy = () => {
    trackClickCTA('copy_bash_command_button');
  };

  return (
    <div className={styles.flexContainer}>
      <div className={styles.textColumn}>
        <Typography>
          <Paragraph>
            Ready to make updates to the{' '}
            <span className="f36-font-weight--demi-bold">Gatsby Starter for Contentful</span> blog?
          </Paragraph>
          <Paragraph>You can create or update content using the Content Management API.</Paragraph>
          <h5>Modify and publish content</h5>
          <Paragraph>
            Enter these snippets in your terminal to modify the author name and publish&nbsp;
            <ExternalTextLink href={href(personEntry)}>the Person entry</ExternalTextLink>.
          </Paragraph>
          <Paragraph>Re-deploy to view this update to the blog.</Paragraph>
        </Typography>
        <Code
          copy
          code={curlSnippets}
          tooltipPosition="right"
          onCopy={_ => onCopy('copy_curl_snippets')}
          style="margin-top: 0"
        />
        <br />
        <Paragraph className="f36-margin-top--s">
          Learn more about the&nbsp;
          <ExternalTextLink href="https://www.contentful.com/developers/docs/references/content-management-api/">
            Content Management API
          </ExternalTextLink>
          .
        </Paragraph>
      </div>
      <div
        role="img"
        aria-label="View of the Gatsby App"
        className={cx(styles.image, 'background-image_gatsby-starter')}
      />
    </div>
  );
};

ModifyContentDrawer.propTypes = {
  managementToken: PropTypes.string.isRequired,
  entry: PropTypes.object.isRequired,
  spaceId: PropTypes.string.isRequired
};

export default ModifyContentDrawer;
