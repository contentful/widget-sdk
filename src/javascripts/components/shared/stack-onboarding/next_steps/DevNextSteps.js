import React from 'react';
import PropTypes from 'prop-types';
import { findKey, isObject, snakeCase } from 'lodash';
import { name as ModifyContentStepModule } from './ModifyContentStep';
import { name as SetupWebhooksStepModule } from './SetupWebhooksStep';
import { name as NotAJSDeveloperStepModule } from './NotAJSDeveloperStep';
import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const MODIFY_CONTENT = 'modifyContent';
export const SETUP_WEBHOOK = 'setupWebhook';
export const NOT_A_JS_DEV = 'notJSDev';

export const name = 'ms-isolated-dev-next-steps';

angular.module('contentful').factory(name, [
  'require',
  require => {
    const store = require('TheStore').getStore();
    const { getStoragePrefix, getUser } = require(CreateModernOnboardingModule);

    const { Progress, Header } = require('app/home/welcome/OnboardingWithTea.es6');

    const ModifyContentStep = require(ModifyContentStepModule);
    const SetupWebhooksStep = require(SetupWebhooksStepModule);
    const NotAJSDeveloperStep = require(NotAJSDeveloperStepModule);

    class DevNextSteps extends React.Component {
      constructor(props) {
        super(props);

        const prefix = getStoragePrefix();

        const onToggle = key => {
          const { expanded } = this.state;
          this.setState({
            // if we toggle currently open one, close it
            expanded: key === expanded ? null : key
          });
        };

        const { track: _track, ...rest } = props;

        const state = {
          [MODIFY_CONTENT]: {
            ...rest,
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

      componentDidMount() {
        if (!this.state[MODIFY_CONTENT].isDone) {
          const user = getUser();
          const isModifyStepDone =
            this.props.entry.fields.name['en-US'] === `${user.firstName} ${user.lastName}`;

          if (isModifyStepDone) {
            this.markAsDone(MODIFY_CONTENT);
          }
        }
      }

      getExpandedStep(state) {
        const { expanded: _, ...rest } = state;
        return findKey(rest, ({ isDone }) => !isDone);
      }

      setExpandedStep() {
        this.setState(state => ({
          expanded: this.getExpandedStep(state)
        }));
      }

      getProgress() {
        return Object.values(this.state)
          .filter(v => isObject(v))
          .reduce((count, { isDone }) => count + Number(Boolean(isDone)), 0);
      }

      markAsDone(step) {
        const key = `${getStoragePrefix()}:devNextSteps:${step}`;
        const isStepDone = store.get(key);

        if (!isStepDone) {
          store.set(key, true);
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
          this.props.track(snakeCase(`${step}Step`) + ':done');
        }
      }

      render() {
        const { expanded } = this.state;

        return (
          <section className="home-section tea-onboarding">
            <Header>
              <h3 className="tea-onboarding__heading">Next steps</h3>
              <Progress count={this.getProgress()} total={3} />
            </Header>
            <div className="tea-onboarding__steps">
              <ModifyContentStep
                isExpanded={expanded === MODIFY_CONTENT}
                track={key => this.props.track(`${snakeCase(MODIFY_CONTENT + 'Step')}:${key}`)}
                {...this.state[MODIFY_CONTENT]}
              />
              <SetupWebhooksStep
                isExpanded={expanded === SETUP_WEBHOOK}
                markAsDone={_ => this.markAsDone(SETUP_WEBHOOK)}
                {...this.state[SETUP_WEBHOOK]}
              />
              <NotAJSDeveloperStep
                markAsDone={_ => this.markAsDone(NOT_A_JS_DEV)}
                {...this.state[NOT_A_JS_DEV]}
              />
            </div>
          </section>
        );
      }
    }

    DevNextSteps.propTypes = {
      managementToken: PropTypes.string.isRequired,
      entry: PropTypes.object.isRequired,
      spaceId: PropTypes.string.isRequired,
      track: PropTypes.func.isRequired
    };

    return DevNextSteps;
  }
]);
