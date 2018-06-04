import React from 'react';
import PropTypes from 'prop-types';
import {name as CodeModule} from '../../../react/atoms/Code';
import {MODIFY_CONTENT} from './DevNextSteps';

const moduleName = 'ms-dev-next-steps-modify-content';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const {href} = require('states/Navigator');
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);
    const {env} = require('environment');

    const {Step} = require('app/home/welcome/OnboardingWithTeaSteps');
    const Code = require(CodeModule);

    const ModifyContentStep = (props) => {
      const {
        isDone,
        isExpanded,
        onToggle,
        managementToken,
        entry,
        spaceId,
        track
      } = props;

      const {firstName, lastName} = user;
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
      modifyContentCurlSnippet += ' -H \'Content-Type: application/vnd.contentful.management.v1+json\'';
      modifyContentCurlSnippet += ' -H \'X-Contentful-Content-Type: person\'';
      modifyContentCurlSnippet += ` --data-binary '{"fields":${JSON.stringify(updatedFields)}}'`;
      modifyContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${entry.sys.id}`;

      let publishContentCurlSnippet = `${commonSnippetChunk}`;
      publishContentCurlSnippet += ` -H 'X-Contentful-Version: ${entry.sys.version + 1}'`;
      publishContentCurlSnippet += ` https://api.${domain}.com/spaces/${spaceId}/entries/${entry.sys.id}/published\n`;

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
          <div className='tea-onboarding__step-description'>
            <p>Ready to make updates to the Gatsby Starter for Contentful blog?</p>
            <p>
              You can create or update content using the Content Management API.
            </p>
            <h5>Modify and publish content</h5>
            <p>
              Enter these snippets in your terminal to modify the author name
              and publish&nbsp;
              <a
                target={'_blank'}
                rel={'noopener noreferrer'}
                href={href(personEntry)}
              >
                the Person entry
              </a>.
            </p>
            <p>Re-deploy to view this update to the blog.</p>
            <Code
              copy
              code={[modifyContentCurlSnippet, publishContentCurlSnippet]}
              tooltipPosition={'right'}
              onCopy={_ => track('copy_curl_snippets')}
              style={'margin-top: 0'}
            />
            <br />
            <p>
              Learn more about the&nbsp;
              <a
                target={'_blank'}
                rel={'noopener noreferrer'}
                href='https://www.contentful.com/developers/docs/references/content-management-api/'
              >
                Content Management API
              </a>.
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
      track: PropTypes.func.isRequired
    };

    return ModifyContentStep;
  }]);

export {moduleName as name};
