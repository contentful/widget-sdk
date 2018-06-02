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
    const {href} = require('states/Navigator');
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);
    const {env} = require('environment');

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
        modifyContentCurlSnippet += ' -H \'Content-Type: application/vnd.contentful.management.v1+json\' -H \'X-Contentful-Content-Type: person\'';
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

        const deployStep = {
          path: ['spaces', 'detail', 'onboarding', 'deploy'],
          params: { spaceId }
        };

        return (
          <Step {...propsForStep}>
            <div className='tea-onboarding__step-description'>
              <p>Interested in making updates to the Gatsby Starter for Contentful blog?</p>
              <p>
                You can create or update content items using the&nbsp;
                <a
                  rel={'noopener noreferrer'}
                  href='https://www.contentful.com/developers/docs/references/content-management-api/'
                >
                  Content Management API
                </a>.
              </p>
              <p>
                The snippets below modify and publish&nbsp;
                <a
                  target={'_blank'}
                  rel={'noopener noreferrer'}
                  href={href(personEntry)}
                >
                  the author name
                </a>.
              </p>
              <h5>Modify and publish content</h5>
              <Code
                copy
                code={[modifyContentCurlSnippet, publishContentCurlSnippet]}
                tooltipPosition={'right'}
              />
              <br />
              <p>
                To view this change on your deployed site run the snippets above and&nbsp;
                <a href={href(deployStep)}>
                  re-deploy
                </a>!
              </p>
            </div>
          </Step>
        );
      }
    }

    ModifyContentStep.propTypes = {
      isExpanded: PropTypes.bool.isRequired,
      isDone: PropTypes.bool.isRequired,
      onToggle: PropTypes.func.isRequired,
      managementToken: PropTypes.string.isRequired,
      entry: PropTypes.object.isRequired,
      spaceId: PropTypes.string.isRequired
    };

    const SetupWebhooksStep = (props) => {
      const {
        isExpanded,
        isDone,
        onToggle,
        deploymentProvider,
        markAsDone
      } = props;
      const propsForStep = {
        headerCopy: 'Set-up webhooks for the Gatsby Starter for Contentful blog ',
        headerIcon: 'page-apis',
        isExpanded,
        isDone,
        onToggle,
        stepKey: SETUP_WEBHOOK
      };
      const domain =
        env === 'production'
        ? 'https://www.contentful.com'
        : 'http://ctf-doc-app-branch-feature-webhooks-guide.netlify.com';
      const url =
        `${domain}/developers/docs/tutorials/general/automate-site-builds-with-webhooks/#${deploymentProvider}`;

      return (
        <Step {...propsForStep}>
          <div className='tea-onboarding__step-description'>
            <p>Some text to do with setting up a webhook</p>
            <p>Some more copy if need be</p>
          </div>
          <a
            href={url}
            target={'_blank'}
            rel={'noopener'}
            className='btn-action tea-onboarding__step-cta'
            onClick={_ => markAsDone()}>
            Create webhook
          </a>
        </Step>
      );
    };

    SetupWebhooksStep.propTypes = {
      isExpanded: PropTypes.bool.isRequired,
      isDone: PropTypes.bool.isRequired,
      onToggle: PropTypes.func.isRequired,
      markAsDone: PropTypes.func.isRequired,
      deploymentProvider: PropTypes.string.isRequired
    };

    const NotAJSDeveloperStep = ({markAsDone, isDone}) => {
      const scrollToSupportedPlatforms = () => {
        markAsDone();
        // Postpone the scroll till the auto expansion of next
        // steps is handled so that the browser is able to
        // calculate the correct offset to scroll to
        setTimeout(() => {
          document
          .querySelector('cf-developer-resources')
          .scrollIntoView(
            {block: 'start', behavior: 'smooth'}
          );
        }, 100);
      };

      const propsForAltStep = {
        headerCopy: 'Not a JS developer? See guides for other supported platforms',
        headerIcon: 'page-media',
        isDone
      };

      return (
        <AltStep {...propsForAltStep}>
          <span
            className='tea-onboarding__alt-step-cta'
            onClick={scrollToSupportedPlatforms}
          >
            Select platform
            <span className='arrow'></span>
          </span>
        </AltStep>
      );
    };

    NotAJSDeveloperStep.propTypes = {
      isDone: PropTypes.bool.isRequired,
      markAsDone: PropTypes.func.isRequired
    };

    class DevNextSteps extends React.Component {
      constructor (props) {
        super(props);

        const prefix = `ctfl:${user.sys.id}:modernStackOnboarding`;

        const onToggle = (key) => {
          const { expanded } = this.state;
          this.setState({
            // if we toggle currently open one, just close it
            expanded: key === expanded ? null : key
          });
        };

        const state = {
          [MODIFY_CONTENT]: {
            ...props,
            isDone: store.get(`${prefix}:devNextSteps:${MODIFY_CONTENT}`) || false,
            onToggle
          },
          [SETUP_WEBHOOK]: {
            isDone: store.get(`${prefix}:devNextSteps:${SETUP_WEBHOOK}`) || false,
            onToggle,
            deploymentProvider: store.get(`${prefix}:deploymentProvider`)
          },
          [NOT_A_JS_DEV]: {
            isDone: store.get(`${prefix}:devNextSteps:${NOT_A_JS_DEV}`) || false
          }
        };

        this.state = {
          expanded: this.getExpandedStep(state),
          ...state
        };
      }

      componentDidMount () {
        if (!this.state[MODIFY_CONTENT].isDone) {
          const isModifyStepDone =
            this.props.entry.fields.name['en-US'] === `${user.firstName} ${user.lastName}`;

          if (isModifyStepDone) {
            this.markAsDone(MODIFY_CONTENT);
          }
        }
      }

      getExpandedStep (state) {
        const {expanded: _, ...rest} = state;
        return findKey(rest, ({isDone}) => !isDone);
      }

      setExpandedStep () {
        this.setState(state => ({
          expanded: this.getExpandedStep(state)
        }));
      }

      getProgress () {
        return Object.values(this.state)
          .filter(v => isObject(v))
          .reduce((count, {isDone}) => count + Number(Boolean(isDone)), 0);
      }

      markAsDone (step) {
        store.set(`ctfl:${user.sys.id}:modernStackOnboarding:devNextSteps:${step}`, true);
        this.setState(state => {
          const stateForStep = state[step];
          stateForStep.isDone = true;
          return {
            [step]: {
              ...stateForStep
            }
          };
        });
        this.setExpandedStep();
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
