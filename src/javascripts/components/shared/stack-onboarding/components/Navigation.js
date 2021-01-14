import React from 'react';
import PropTypes from 'prop-types';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import { isOnboardingComplete } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { cx } from 'emotion';

const Step = ({ id, title, value, link, trackingElementId, active }) => {
  const className = 'modern-stack-onboarding--navigation-circle';
  const activeClassName = id <= active ? `${className}__active` : '';
  const classNames = cx(className, activeClassName);
  const linkMarkup =
    id < active ? (
      <WithLink trackingElementId={trackingElementId} link={link}>
        {(move) => (
          <div className={classNames} onClick={move} data-test-id={activeClassName || className}>
            {value}
          </div>
        )}
      </WithLink>
    ) : (
      <div className={classNames} data-test-id={activeClassName || className}>
        {value}
      </div>
    );
  return (
    <div className="modern-stack-onboarding--navigation-block">
      {linkMarkup}
      <div className="modern-stack-onboarding--navigation-title-wrapper">
        <div className="modern-stack-onboarding--navigation-title">{title}</div>
      </div>
    </div>
  );
};

Step.propTypes = {
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  link: PropTypes.string,
  trackingElementId: PropTypes.string.isRequired,
  active: PropTypes.oneOf([1, 2, 3, 4]),
};

const Navigation = ({ active }) => {
  // 4 marks all steps as done and let's you move both
  // back and forth using the step number navigation
  active = isOnboardingComplete() ? 4 : active;

  return (
    <div className="modern-stack-onboarding--navigation">
      <div className="modern-stack-onboarding--navigation-wrapper">
        <Step
          active={active}
          id={1}
          value={1}
          title="Copy website repository"
          link="copy"
          trackingElementId="copy_step_from_navigation"
        />
        <Step
          active={active}
          id={2}
          value={2}
          title="Explore website content structure"
          link="explore"
          trackingElementId="explore_step_from_navigation"
        />
        <Step
          active={active}
          id={3}
          value={3}
          title="Deploy website"
          link="deploy"
          trackingElementId="deploy_step_from_navigation"
        />
      </div>
      <div className="modern-stack-onboarding--navigation-line" />
    </div>
  );
};

Navigation.propTypes = {
  active: PropTypes.oneOf([1, 2, 3]),
};

export default Navigation;
