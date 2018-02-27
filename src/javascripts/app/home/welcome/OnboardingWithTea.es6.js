import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';
import { go } from 'states/Navigator';
import Analytics from 'analytics/Analytics';

const OnboardingWithTea = createReactClass({
  getInitialState () {
    const self = this;
    // hydrate state with serialized state from localStorage
    return {
      steps: [
        {
          copy: {
            header: 'View the sample content',
            body: [
              'This example space shows best practices on how to structure your content and integrate your website and app with Contentful.',
              'Have a look at the two courses composing this example.'
            ],
            graphic: 'Here’s how this content is nested:',
            primaryCta: 'View content'
          },
          graphicName: 'content-structure-graph',
          primaryCtaOnClick: _ => {
            // TODO: trigger analytics

            // TODO: serlialize to localStorage

            // set state
            self.setState({
              steps: [
                {
                  ...self.state.steps[0],
                  isDone: true
                },
                ...self.state.steps.slice(1)
              ]
            }, _ => {
              // TODO: Navigate to content page filtered by contentTypeId=course
              console.log('Step 1 done')
            });
          },
          isDone: false
        }
      ]
    };
  },
  getProgressCount () {
    return this.state.steps.reduce((acc, { isDone }) => {
      if (isDone) {
        acc += 1;
      }
      return acc;
    }, 0);
  },
  render () {
    let foundStepToExpand = false;

    return (
      <section className='home-section tea-onboarding'>
        <Header progress={this.getProgressCount()} />
        {
          this.state.steps.map((step, i) => {
            // expand the first incomplete step
            if (!foundStepToExpand && !step.isDone) {
              foundStepToExpand = true;
              return <Step {...step} isExpanded={true} key={i} />;
            } else {
              return <Step {...step} isExpanded={false} key={i} />;
            }
          })
        }
      </section>
    );
  }
});

const Header = createReactClass({
  propTypes: {
    progress: PropTypes.number.isRequired
  },
  render () {
    return (
      <div>
        <h2 className='home-section__heading'>Let’s get started</h2>
        <Progress count={this.props.progress} />
      </div>
    );
  }
});

const Progress = createReactClass({
  propTypes: {
    count: PropTypes.number.isRequired
  },
  render () {
    return <span>{this.props.count}</span>;
  }
});

const Step = createReactClass({
  propTypes: {
    isExpanded: PropTypes.bool.isRequired,
    copy: PropTypes.shape({
      header: PropTypes.string.isRequired,
      body: PropTypes.arrayOf(PropTypes.string),
      graphic: PropTypes.string.isRequired,
      primaryCta: PropTypes.string.isRequired
    }),
    graphicName: PropTypes.string,
    primaryCtaOnClick: PropTypes.func.isRequired,
    isDone: PropTypes.bool.isRequired
  },
  getInitialState () {
    return {
      isExpanded: this.props.isExpanded
    };
  },
  render () {
    return (
      <div className='tea-onboarding__step'>
        <div className='tea-onboarding__step-header'>
          <Icon name='page-media' className='tea-onboarding__step-header-icon' />
          <h3>{this.props.copy.header}</h3>
          <span>Hide details <i className={this.state.isExpanded ? 'arrow-down' : 'arrow-right'} /></span>
        </div>
        <div className={`tea-onboarding__step-body ${this.state.isExpanded ? 'tea-onboarding__step-body--expanded' : ''}`}>
          <div>
            <div>
              {this.props.copy.body.map((c, i) => <p key={i}>{c}</p>)}
            </div>
            <button className='btn-action' onClick={e => this.props.primaryCtaOnClick(e)}>
              {this.props.copy.primaryCta}
            </button>
          </div>
          <div>
            <p>{this.props.copy.graphic}</p>
            <Icon name={this.props.graphicName} />
          </div>
        </div>
      </div>
    );
  }
});

export default OnboardingWithTea;
