import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import FetchSubscriptionPrice from './FetchSubscriptionPrice';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {Steps, RequestState, formatPrice} from './WizardUtils';

const ConfirmScreen = createReactClass({
  propTypes: {
    spaceRatePlan: PropTypes.object.isRequired,
    spaceName: PropTypes.string.isRequired,
    template: PropTypes.object,
    organization: PropTypes.object.isRequired,
    isFormSubmitted: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func.isRequired
  },
  render () {
    const {
      spaceRatePlan,
      spaceName,
      template,
      organization,
      isFormSubmitted,
      onSubmit,
      onNavigate
    } = this.props;

    return (
      <FetchSubscriptionPrice organizationId={organization.sys.id}>
        {({requestState, totalPrice}) => (
          <div>
            {requestState === RequestState.PENDING && <div className="loader__container">
              {asReact(spinner({diameter: '40px'}))}
            </div>}
            {requestState !== RequestState.PENDING && <div>
              <h2 className="create-space-wizard__heading">
                Confirm your selection
              </h2>
              <p className="create-space-wizard__subheading">
                Make sure everything is in order before creating the space.
              </p>
              <p className="create-space-wizard__info">
                You are about to purchase a {spaceRatePlan.name.toLowerCase()} space
                for <strong>{formatPrice(spaceRatePlan.price)} / month</strong> for the
                organization <em>{organization.name}</em>.
                {requestState === RequestState.SUCCESS && <span>
                  {' '}
                  This will increase your organization’s subscription
                  to <strong>{formatPrice(totalPrice + spaceRatePlan.price)} / month</strong>
                </span>}
                {' '}
                (<a
                  className="text-link"
                  href="#"
                  onClick={() => onNavigate(Steps.SpaceType)}>
                  change space type
                </a>).
                The space’s name will be <em>{spaceName}</em>
                {template && ', and we will fill it with example content'}
                {' '}
                (<a
                  className="text-link"
                  href="#"
                  onClick={() => onNavigate(Steps.SpaceDetails)}>
                  change space details
                </a>).
              </p>
              <div style={{textAlign: 'center', margin: '1.2em 0'}}>
                <button
                  className={`button btn-primary-action ${isFormSubmitted ? 'is-loading' : ''}`}
                  disabled={isFormSubmitted}
                  onClick={onSubmit}>
                  Confirm and create space
                </button>
              </div>
            </div>}
          </div>
        )}
      </FetchSubscriptionPrice>
    );
  },
  componentDidMount () {
    this.props.onDimensionsChange();
  }
});

export default ConfirmScreen;
