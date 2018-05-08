import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import FetchSubscriptionPrice from './FetchSubscriptionPrice';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {Steps, RequestState, formatPrice} from './WizardUtils';
import Price from 'ui/Components/Price';

const ConfirmScreen = createReactClass({
  propTypes: {
    currentSpaceRatePlan: PropTypes.object,
    newSpaceRatePlan: PropTypes.object.isRequired,
    space: PropTypes.object,
    action: PropTypes.string.isRequired,
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
      currentSpaceRatePlan,
      newSpaceRatePlan,
      spaceName,
      space,
      action,
      template,
      organization,
      isFormSubmitted,
      onSubmit,
      onNavigate,
      onDimensionsChange
    } = this.props;

    let confirmButtonText = '';

    if (action === 'create') {
      confirmButtonText = 'Confirm and create space';
    } else if (action === 'change') {
      confirmButtonText = 'Confirm and upgrade space';
    }

    return (
      <FetchSubscriptionPrice organizationId={organization.sys.id} onUpdate={onDimensionsChange}>
        {({requestState, totalPrice}) => (
          <div>
            {requestState === RequestState.PENDING && <div className="loader__container">
              {asReact(spinner({diameter: '40px'}))}
            </div>}
            {requestState !== RequestState.PENDING && <div>
              <h2 className="create-space-wizard__heading">
                Confirm your selection
              </h2>
              { action === 'create' &&
                <Fragment>
                  <p className="create-space-wizard__subheading">
                    Make sure everything is in order before creating your space.
                  </p>
                  <p className="create-space-wizard__info">
                    You are about to purchase a {newSpaceRatePlan.name.toLowerCase()} space
                    for <strong>{formatPrice(newSpaceRatePlan.price)} / month</strong> for the
                    organization <em>{organization.name}</em>.
                    {requestState === RequestState.SUCCESS && <span>
                      {' '}
                      This will increase your organization’s subscription
                      to <strong>{formatPrice(totalPrice + newSpaceRatePlan.price)} / month</strong>
                    </span>}
                    {' '}
                    (<a
                      className="text-link"
                      href="#"
                      onClick={() => onNavigate(Steps.SpaceCreateSteps.SpaceType)}>
                      change space type
                    </a>).
                    The space’s name will be <em>{spaceName}</em>
                    {template && ', and we will fill it with example content'}
                    {' '}
                    (<a
                      className="text-link"
                      href="#"
                      onClick={() => onNavigate(Steps.SpaceCreateSteps.SpaceDetails)}>
                      change space details
                    </a>).
                  </p>
                </Fragment>
              }
              { action === 'change' &&
                <Fragment>
                  <p className="create-space-wizard__subheading">
                    Make sure everything is in order before confirming the change.
                  </p>
                  <p className="create-space-wizard__info">
                    <span>You&apos;re about to change the space <em>{space.name}</em> from a {currentSpaceRatePlan.name} to a {newSpaceRatePlan.name} space type.&#32;</span>

                    { currentSpaceRatePlan.price === 0 &&
                      <Fragment>
                        The price of this space will now be <strong><Price value={newSpaceRatePlan.price} /></strong> and will increase
                      </Fragment>
                    }
                    { currentSpaceRatePlan.price !== 0 && currentSpaceRatePlan.price >= newSpaceRatePlan.price &&
                      <Fragment>
                        The price of this space will change from <strong><Price value={currentSpaceRatePlan.price} /></strong> to <strong><Price value={newSpaceRatePlan.price} /></strong> and will reduce
                      </Fragment>
                    }
                    { currentSpaceRatePlan.price !== 0 && currentSpaceRatePlan.price < newSpaceRatePlan.price &&
                      <Fragment>
                        The price of this space will change from <strong><Price value={currentSpaceRatePlan.price} /></strong> to <strong><Price value={newSpaceRatePlan.price} /></strong> and will increase
                      </Fragment>
                    }
                    <span>&#32;the total price of the spaces in your organization to <strong><Price unit='month' value={(totalPrice + newSpaceRatePlan.price - currentSpaceRatePlan.price)} /></strong>.</span>
                  </p>
                </Fragment>
              }
              <div style={{textAlign: 'center', margin: '1.2em 0'}}>
                <button
                  className={`button btn-primary-action ${isFormSubmitted ? 'is-loading' : ''}`}
                  disabled={isFormSubmitted}
                  data-test-id="space-create-confirm"
                  onClick={onSubmit}
                >
                  {confirmButtonText}
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
