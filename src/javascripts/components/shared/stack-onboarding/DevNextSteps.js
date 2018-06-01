import React from 'react';
import PropTypes from 'prop-types';
import {name as CodeModule} from '../../react/atoms/Code';
import {findKey, isObject} from 'lodash';

const MODIFY_CONTENT = 'modifyContent';
const SETUP_WEBHOOK = 'setupWebhook';
const NOT_A_JS_DEV = 'notAJSDev';
const moduleName = 'ms-isolated-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);
    const {env} = require('environment');
    const domain = env === 'production' ? 'contentful' : 'flinkly';

    const {Progress, Header} = require('app/home/welcome/OnboardingWithTea');
    const {Step, AltStep} = require('app/home/welcome/OnboardingWithTeaSteps');
    const Code = require(CodeModule);

    class ModifyContentStep extends React.Component {
      render () {
        const {
          isDone,
          isExpanded,
          onToggle,
          managementToken,
          entry,
          spaceId
        } = this.props;
        const {firstName, lastName} = user;

        const {fields} = entry;
        fields.name['en-US'] = `${firstName} ${lastName}`;

        const commonSnippetChunk = `curl -X PUT -H 'Authorization: Bearer ${managementToken}'`;

        let modifyContentCurlSnippet = `${commonSnippetChunk}`;
        modifyContentCurlSnippet += ` -H 'X-Contentful-Version: ${entry.sys.version}'`;
        modifyContentCurlSnippet += ' -H \'Content-Type: application/vnd.contentful.management.v1+json\' -H \'X-Contentful-Content-Type: person\'';
        modifyContentCurlSnippet += ` --data-binary '{"fields":${JSON.stringify(fields)}}'`;
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

        return (
          <Step {...propsForStep}>
            <div className='tea-onboarding__step-description'>
              <p>Interested in making updates to the Gatsby Starter for Contentful blog?</p>
              <p>
                You can create or update content items using the&nbsp;
                <a href='https://www.contentful.com/developers/docs/references/content-management-api/'>
                  Content Management API
                </a>.
              </p>
              <h5>Modify and publish content</h5>
              <Code copy code={[modifyContentCurlSnippet, publishContentCurlSnippet]} />
            </div>
          </Step>
        );
      }
    }

    ModifyContentStep.propTypes = {
      isExpanded: PropTypes.bool.isRequired,
      isDone: PropTypes.bool.isRequired,
      onToggle: PropTypes.func.isRequired,
      markAsDone: PropTypes.func.isRequired,
      managementToken: PropTypes.string.isRequired,
      entry: PropTypes.object.isRequired,
      spaceId: PropTypes.string.isRequired
    };

    const SetupWebhooksStep = () => null;
    const NotAJSDeveloperStep = () => null;

    class DevNextSteps extends React.Component {
      constructor (props) {
        super(props);

        const onToggle = (key) => {
          const { expanded } = this.state;
          this.setState({
            // if we toggle currently open one, just close it
            expanded: key === expanded ? null : key
          });
        };

        const isModifyStepDone =
          props.entry.fields.name['en-US'] === `${user.firstName} ${user.lastName}`;

        const state = {
          [MODIFY_CONTENT]: {
            ...props,
            isDone: isModifyStepDone || false,
            onToggle
          },
          [SETUP_WEBHOOK]: {
            isDone: false,
            onToggle
          },
          [NOT_A_JS_DEV]: {
            isDone: false
          }
        };

        const expandedStep = this.getExpandedStep(state);

        this.state = {
          expanded: expandedStep,
          ...state
        };
      }

      getExpandedStep (state) {
        return findKey(state, ({isDone}) => !isDone);
      }

      getProgress () {
        return Object.values(this.state)
          .filter(v => isObject(v))
          .reduce((count, {isDone}) => count + Number(Boolean(isDone)), 0);
      }

      markAsDone (step) {
        store.set(`ctfl:${user.sys.id}:modernStackOnboarding:devNextSteps:${step}`, true);
        this.setState({
          [step]: {
            isDone: true
          }
        });
      }

      render () {
        const {expanded} = this.state;

        return (
          <section className='home-section tea-onboarding'>
            <Header>
              <h3 className='tea-onboarding__heading'>Next steps</h3>
              <Progress count={this.getProgress()} total={3} />
            </Header>
            <div className='tea-onboarding__steps'>
              <ModifyContentStep
                isExpanded={expanded === MODIFY_CONTENT}
                {...this.state[MODIFY_CONTENT]} />
              <SetupWebhooksStep
                isExpanded={expanded === SETUP_WEBHOOK}
                markAsDone={_ => this.markAsDone(SETUP_WEBHOOK)}
                {...this.state[SETUP_WEBHOOK]} />
              <NotAJSDeveloperStep
                markAsDone={_ => this.markAsDone(NOT_A_JS_DEV)}
                {...this.state[NOT_A_JS_DEV]} />
            </div>
          </section>
        );
      }
    }

    DevNextSteps.propTypes = {
      managementToken: PropTypes.string.isRequired,
      entry: PropTypes.object.isRequired,
      spaceId: PropTypes.string.isRequired
    };

    return DevNextSteps;
  }]);

export { moduleName as name };
