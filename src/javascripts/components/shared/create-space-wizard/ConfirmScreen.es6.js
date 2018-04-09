import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import FetchSubscriptionPrice, {RequestState} from './FetchSubscriptionPrice';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';

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
              <p>
                You are about to purchase a {spaceRatePlan.name.toLowerCase()} space
                for ${formatPrice(spaceRatePlan.price)} / month for the organization {organization.name}.
                {requestState === RequestState.SUCCESS &&
                  ` This will bring up the total of your organization’s subscription to $${formatPrice(totalPrice + spaceRatePlan.price)} / month `
                }
                (<a
                  className="text-link"
                  href="#"
                  onClick={() => onNavigate(0)}>
                  change space type
                </a>).
                The space’s name will be {spaceName}, and
                {template
                  ? ` we'll fill it with example content for ${template.name} `
                  : ' we won’t fill it with example content '
                }
                (<a
                  className="text-link"
                  href="#"
                  onClick={() => onNavigate(1)}>
                  change space details
                </a>).
              </p>
              <div style={{textAlign: 'center', margin: '1.2em 0'}}>
                <button
                  className={`button btn-action ${isFormSubmitted ? 'is-loading' : ''}`}
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

function formatPrice (value) {
  return parseInt(value, 10).toLocaleString('en-US');
}

export default ConfirmScreen;
