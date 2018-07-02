import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { get, range, trim } from 'lodash';
import moment from 'moment';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {formatPrice} from './WizardUtils';
import Price from 'ui/Components/Price';
import { TextField } from '@contentful/ui-component-library';

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
    setPartnershipFields: PropTypes.func.isRequired,
    subscriptionPrice: PropTypes.object.isRequired,
    partnership: PropTypes.object
  },

  getInitialState () {
    return {
      partnershipFields: {},
      partnershipValidation: {}
    };
  },

  componentDidMount () {
    const { organization, fetchSubscriptionPrice } = this.props;

    fetchSubscriptionPrice({ organization });
  },

  onPartnershipFieldChange (fieldName) {
    return (value) => {
      const { setPartnershipFields } = this.props;
      const { partnershipFields } = this.state;

      partnershipFields[fieldName] = value;

      this.setState({ partnershipFields });
      setPartnershipFields({ fields: partnershipFields });
    };
  },

  onSubmit () {
    const { partnership, onSubmit } = this.props;
    const { partnershipFields } = this.state;
    const { isPartnership } = partnership;

    if (isPartnership) {
      // All of the partnership information is required if this is a partnership form
      const fieldNames = [ 'estimatedDeliveryDate', 'clientName', 'description' ];

      // Validate that the fields are present and not considered empty
      const validation = fieldNames.reduce((memo, name) => {
        const fieldValue = trim(get(partnershipFields, name));

        if (!fieldValue) {
          memo[name] = 'This field is required';
        }

        return memo;
      }, {});

      // TODO: validate that the date is in the future

      this.setState({ partnershipValidation: validation });

      if (Object.keys(validation).length > 0) {
        return;
      } else {
        onSubmit();
      }
    } else {
      onSubmit();
    }
  },

  render () {
    const {
      currentPlan,
      selectedPlan,
      space,
      action,
      organization,
      subscriptionPrice,
      spaceCreation,
      spaceChange,
      newSpaceMeta,
      partnership
    } = this.props;
    const { partnershipValidation } = this.state;

    let confirmButtonText = '';

    if (action === 'create') {
      confirmButtonText = 'Confirm and create space';
    } else if (action === 'change') {
      confirmButtonText = 'Confirm and change space';
    }

    const { isPending, totalPrice, error } = subscriptionPrice;
    const { template, name } = newSpaceMeta;
    const { isPartnership } = partnership;
    const submitted = spaceCreation.isPending || spaceChange.isPending;

    return (
      <div>
        {
          isPending &&
          <div className="loader__container">
            {asReact(spinner({diameter: '40px'}))}
          </div>
        }
        {
          !isPending &&
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
                  { !isPartnership && selectedPlan.price === 0 &&
                    <Fragment>
                      You are about to create a free space for the organization <em>{organization.name}</em> and it won&apos;t change your organization&apos;s subscription.
                    </Fragment>
                  }
                  {
                    isPartnership &&
                    <ConfirmScreen.PartnershipForm
                      organization={organization}
                      template={template}
                      spaceName={name}
                      validation={partnershipValidation}
                      onFieldChange={this.onPartnershipFieldChange}
                    />
                  }
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
                onClick={this.onSubmit}
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

ConfirmScreen.PartnershipForm = class extends React.Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    spaceName: PropTypes.string.isRequired,
    onFieldChange: PropTypes.func.isRequired,
    validation: PropTypes.object,
    template: PropTypes.object
  }

  constructor ({ onFieldChange }) {
    super();

    // Set the initial date to today in the form
    const date = new Date();
    const estimatedDeliveryDateYear = date.getFullYear();
    const estimatedDeliveryDateMonth = date.getUTCMonth() + 1;
    const estimatedDeliveryDateDay = date.getUTCDate();
    const estimatedDeliveryDate = moment()
      .year(estimatedDeliveryDateYear)
      .month(estimatedDeliveryDateMonth)
      .date(estimatedDeliveryDateDay)
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);

    this.state = {
      estimatedDeliveryDateYear,
      estimatedDeliveryDateMonth,
      estimatedDeliveryDateDay,
      estimatedDeliveryDate
    };

    onFieldChange('estimatedDeliveryDate')(estimatedDeliveryDate.toISOString());
  }

  onChange (fieldName) {
    const { onFieldChange } = this.props;

    return (event) => {
      const value = event.target.value;

      this.setState({ [fieldName]: value });

      if (!fieldName.match('^estimatedDeliveryDate')) {
        return onFieldChange(fieldName)(value);
      } else {
        // Make the date then save it as `estimatedDeliveryDate`
        const { estimatedDeliveryDate } = this.state;
        const type = fieldName.split('estimatedDeliveryDate')[1];

        if (type === 'Day') {
          estimatedDeliveryDate.date(value);
        } else if (type === 'Month') {
          estimatedDeliveryDate.month(value);
        } else if (type === 'Year') {
          estimatedDeliveryDate.year(value);
        }

        this.setState({ estimatedDeliveryDate });

        return onFieldChange('estimatedDeliveryDate')(estimatedDeliveryDate.toISOString());
      }
    };
  }

  render () {
    const { organization, template, spaceName, validation } = this.props;
    const {
      estimatedDeliveryDateYear,
      estimatedDeliveryDateMonth,
      estimatedDeliveryDateDay
    } = this.state;

    const months = {
      'January': 31,
      'February': 28,
      'March': 31,
      'April': 30,
      'May': 31,
      'June': 30,
      'July': 31,
      'August': 31,
      'September': 30,
      'October': 31,
      'November': 30,
      'December': 31
    };

    const currentYear = (new Date()).getFullYear();
    const years = [
      currentYear,
      currentYear + 1,
      currentYear + 2
    ];

    return (
      <Fragment>
        You are about to create a space for the organization <em>{organization.name}</em>. The space’s name will be <em>{spaceName}</em>
    {template && ', and we will fill it with example content'}
    {'. '}
        Before you do, please give us a few more details about this space.
        <fieldset className='fieldset'>
          <legend>Project information</legend>
          <div>
            <TextField
              labelText="Client name"
              name="clientName"
              id="clientName"
              validationMessage={validation.clientName}
              onChange={this.onChange('clientName')}
            />
          </div>
          <div>
            <TextField
              labelText="Short description"
              name="description"
              id="description"
              validationMessage={validation.description}
              onChange={this.onChange('description')}
            />
          </div>

          <div>
            <label htmlFor='estimatedDeliveryDateMonth'>Estimated Delivery Date</label>
            <div>
              <select
                id='estimatedDeliveryDateMonth'
                name='estimatedDeliveryDateMonth'
                value={estimatedDeliveryDateMonth}
                onChange={this.onChange('estimatedDeliveryDateMonth')}
                className="cfnext-select-box"
              >
                {
                  Object.keys(months).map((name, i) => {
                    return <option key={name} value={i + 1}>{name}</option>;
                  })
                }
              </select>
              <select
                name='estimatedDeliveryDateDay'
                value={estimatedDeliveryDateDay}
                onChange={this.onChange('estimatedDeliveryDateDay')}
                className="cfnext-select-box"
              >
                {
                  (range(Object.values(months)[estimatedDeliveryDateMonth - 1])).map(day => {
                    return <option key={day} value={day + 1}>{day + 1}</option>;
                  })
                }
              </select>
              <select
                name='estimatedDeliveryDateYear'
                value={estimatedDeliveryDateYear}
                onChange={this.onChange('estimatedDeliveryDateYear')}
                className="cfnext-select-box"
              >
                {
                  years.map(year => {
                    return <option key={year} value={year}>{year}</option>;
                  })
                }
              </select>
            </div>
          </div>
        </fieldset>
      </Fragment>
    );
  }
};

export default ConfirmScreen;
