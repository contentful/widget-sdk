import React from 'react';
import PropTypes from 'prop-types';
import { MODIFY_CONTENT } from './DevNextSteps';
import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'ms-dev-next-steps-modify-content';

angular.module('contentful').factory(name, [
  'require',
  require => {
    const { href } = require('states/Navigator.es6');
    const { env } = require('environment');
    const { getUser } = require(CreateModernOnboardingModule);

    const { Step } = require('app/home/welcome/OnboardingWithTeaSteps.es6');
    const Code = require('components/react/atoms/Code.es6').default;
    const A = require('components/react/atoms/Anchor.es6').default;

    const ModifyContentStep = props => {
      const { isDone, isExpanded, onToggle, managementToken, entry, spaceId, onCopy } = props;

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
      modifyContentCurlSnippet +=
        " -H 'Content-Type: application/vnd.contentful.management.v1+json'";
      modifyContentCurlSnippet += " -H 'X-Contentful-Content-Type: person'";
      modifyContentCurlSnippet += ` --data-binary '{"fields":${JSON.stringify(updatedFields)}}'`;
      modifyContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${
        entry.sys.id
      }`;

      let publishContentCurlSnippet = `${commonSnippetChunk}`;
      publishContentCurlSnippet += ` -H 'X-Contentful-Version: ${entry.sys.version + 1}'`;
      publishContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${
        entry.sys.id
      }/published\n`;

      // replace single quotes with double because windows doesn't seem to like
      // single quotes very much and errors when you paste and run the snippets in cmd
      const curlSnippets = [modifyContentCurlSnippet, publishContentCurlSnippet].map(snippet =>
        snippet.replace(/"/g, '\\"').replace(/'/g, '"')
      );

      const propsForStep = {
        headerCopy: 'Modify the Gatsby Starter for Contentful blog content',
        headerIcon: 'page-content',
        isExpanded,
        isDone,
        onToggle,
        stepKey: MODIFY_CONTENT
      };

      const personEntry = {
        path: ['spaces', 'detail', 'entries', 'detail'],
        params: { spaceId, entryId: entry.sys.id }
      };

      return (
        <Step {...propsForStep}>
          <div className="tea-onboarding__step-description">
            <p>Ready to make updates to the Gatsby Starter for Contentful blog?</p>
            <p>You can create or update content using the Content Management API.</p>
            <h5>Modify and publish content</h5>
            <p>
              Enter these snippets in your terminal to modify the author name and publish&nbsp;
              <A href={href(personEntry)}>the Person entry</A>.
            </p>
            <p>Re-deploy to view this update to the blog.</p>
            <Code
              copy
              code={curlSnippets}
              tooltipPosition="right"
              onCopy={_ => onCopy('copy_curl_snippets')}
              style="margin-top: 0"
            />
            <br />
            <p>
              Learn more about the&nbsp;
              <A href="https://www.contentful.com/developers/docs/references/content-management-api/">
                Content Management API
              </A>
              .
            </p>
          </div>
        </Step>
      );
    };

    ModifyContentStep.propTypes = {
      isExpanded: PropTypes.bool.isRequired,
      isDone: PropTypes.bool.isRequired,
      onToggle: PropTypes.func.isRequired,
      managementToken: PropTypes.string.isRequired,
      entry: PropTypes.object.isRequired,
      spaceId: PropTypes.string.isRequired,
      onCopy: PropTypes.func.isRequired
    };

    return ModifyContentStep;
  }
]);
