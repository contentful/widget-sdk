import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Steps from './OnboardingWithTeaSteps';

const OnboardingWithTea = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  render () {
    return (
      <section className='home-section tea-onboarding'>
        <Header progress={1} />
        <Steps orgId={this.props.orgId} />
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

export default OnboardingWithTea;
