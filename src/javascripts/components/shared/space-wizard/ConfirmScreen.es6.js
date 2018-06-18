import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {formatPrice} from './WizardUtils';
import Price from 'ui/Components/Price';

const ConfirmScreen = createReactClass({
  propTypes: {
    currentPlan: PropTypes.object,
    selectedPlan: PropTypes.object.isRequired,
    space: PropTypes.object,
    action: PropTypes.string.isRequired,
    template: PropTypes.object,
    organization: PropTypes.object.isRequired,
    fetchSubscriptionPrice: PropTypes.func.isRequired,
    spaceCreation: PropTypes.object.isRequired,
    spaceChange: PropTypes.object.isRequired,
    newSpaceMeta: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    subscriptionPrice: PropTypes.object.isRequired
  },

  componentDidMount () {
    const { organization, fetchSubscriptionPrice } = this.props;

    fetchSubscriptionPrice({ organization });
  },

  render () {
    const {
      currentPlan,
      selectedPlan,
      space,
      action,
      organization,
      onSubmit,
      subscriptionPrice,
      spaceCreation,
      spaceChange,
      newSpaceMeta
    } = this.props;

    let confirmButtonText = '';

    if (action === 'create') {
      confirmButtonText = 'Confirm and create space';
    } else if (action === 'change') {
      confirmButtonText = 'Confirm and change space';
    }

    const { isLoading, totalPrice, error } = subscriptionPrice;
    const { name, template } = newSpaceMeta;
    const submitted = spaceCreation.isLoading || spaceChange.isLoading;

    return (
      <div>
        {
          isLoading &&
          <div className="loader__container">
            {asReact(spinner({diameter: '40px'}))}
          </div>
        }
        {
          !isLoading &&
          <div>
            <h2 className="create-space-wizard__heading">
              Confirm your selection
            </h2>
            { action === 'create' &&
              <Fragment>
                <p className="create-space-wizard__subheading">
                  Make sure everything is in order before creating your space.
                </p>
                <p className="create-space-wizard__info">
                  { selectedPlan.price > 0 &&
                    <Fragment>
                      You are about to purchase a {selectedPlan.name.toLowerCase()} space
                      for <strong>{formatPrice(selectedPlan.price)} / month</strong> for the
                      organization <em>{organization.name}</em>.
                      {
                        !error &&
                        <span>
                          {' '}
                          This will increase your organization’s subscription
                          to <strong>{formatPrice(totalPrice + selectedPlan.price)} / month</strong>
                        </span>
                      }
                    </Fragment>
                  }
                  { selectedPlan.price === 0 &&
                    <Fragment>
                      You are about to create a free space for the organization <em>{organization.name}</em> and it won&apos;t change your organization&apos;s subscription.
                    </Fragment>
                  }
                  {' '}
                  The space’s name will be <em>{name}</em>
                  {template && ', and we will fill it with example content'}
                  {'.'}
                </p>
              </Fragment>
            }
            { action === 'change' &&
              <Fragment>
                <p className="create-space-wizard__subheading">
                  Make sure everything is in order before confirming the change.
                </p>
                <p className="create-space-wizard__info">
                  <span>You&apos;re about to change the space <em>{space.name}</em> from a {currentPlan.name} to a {selectedPlan.name} space type.&#32;</span>

                  { currentPlan.price === 0 &&
                    <Fragment>
                      The price of this space will now be <strong><Price value={selectedPlan.price} /></strong> and will increase
                    </Fragment>
                  }
                  { currentPlan.price !== 0 && currentPlan.price >= selectedPlan.price &&
                    <Fragment>
                      The price of this space will change from <strong><Price value={currentPlan.price} /></strong> to <strong><Price value={selectedPlan.price} /></strong> and will reduce
                    </Fragment>
                  }
                  { currentPlan.price !== 0 && currentPlan.price < selectedPlan.price &&
                    <Fragment>
                      The price of this space will change from <strong><Price value={currentPlan.price} /></strong> to <strong><Price value={selectedPlan.price} /></strong> and will increase
                    </Fragment>
                  }
                  <span>&#32;the total price of the spaces in your organization to <strong><Price unit='month' value={(totalPrice + selectedPlan.price - currentPlan.price)} /></strong>.</span>
                </p>
              </Fragment>
            }
            <div style={{textAlign: 'center', margin: '1.2em 0'}}>
              <button
                className={`button btn-primary-action ${submitted ? 'is-loading' : ''}`}
                disabled={submitted}
                data-test-id="space-create-confirm"
                onClick={onSubmit}
              >
                {confirmButtonText}
              </button>
            </div>
          </div>
        }
      </div>
    );
  }
});

export default ConfirmScreen;
