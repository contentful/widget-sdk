import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { range } from 'lodash';

import { TextField, Icon } from '@contentful/ui-component-library';

export default class PartnershipForm extends React.Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    spaceName: PropTypes.string.isRequired,
    onFieldChange: PropTypes.func.isRequired,
    validation: PropTypes.object,
    template: PropTypes.object
  };

  constructor({ onFieldChange }) {
    super();

    // Set the initial date to today in the form
    const estimatedDeliveryDate = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .utcOffset(0, true);

    this.state = {
      estimatedDeliveryDate
    };

    onFieldChange('estimatedDeliveryDate')(estimatedDeliveryDate.toISOString());
  }

  onChange(fieldName) {
    const { onFieldChange } = this.props;

    return event => {
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

  render() {
    const { organization, template, spaceName, validation } = this.props;
    const { estimatedDeliveryDate } = this.state;

    const months = moment.months();
    const daysInCurrentMonth = estimatedDeliveryDate.daysInMonth();
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1, currentYear + 2];

    return (
      <Fragment>
        You are about to create a space for the organization <em>{organization.name}</em>. The
        space’s name will be <em>{spaceName}</em>
        {template && ', and we will fill it with example content'}
        {'. '}
        Before you do, please give us a few more details about this space. These details will be
        sent to your partnership manager.
        <fieldset className="fieldset">
          <legend>Project information</legend>
          <div className="field">
            <TextField
              labelText="Client name"
              name="clientName"
              id="clientName"
              validationMessage={validation.clientName}
              onChange={this.onChange('clientName')}
            />
          </div>
          <div className="field">
            <TextField
              labelText="Short project description"
              name="description"
              id="description"
              validationMessage={validation.description}
              onChange={this.onChange('description')}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="estimatedDeliveryDateMonth">
              Estimated Delivery Date
            </label>
            <div>
              <select
                id="estimatedDeliveryDateMonth"
                name="estimatedDeliveryDateMonth"
                value={estimatedDeliveryDate.month()}
                onChange={this.onChange('estimatedDeliveryDateMonth')}
                className="cfnext-select-box"
                aria-invalid={Boolean(validation.estimatedDeliveryDate)}>
                {months.map((name, i) => {
                  return (
                    <option key={name} value={i}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <select
                name="estimatedDeliveryDateDay"
                value={estimatedDeliveryDate.date()}
                onChange={this.onChange('estimatedDeliveryDateDay')}
                className="cfnext-select-box"
                aria-invalid={Boolean(validation.estimatedDeliveryDate)}>
                {range(daysInCurrentMonth).map(day => {
                  return (
                    <option key={day} value={day + 1}>
                      {day + 1}
                    </option>
                  );
                })}
              </select>
              <select
                name="estimatedDeliveryDateYear"
                value={estimatedDeliveryDate.year()}
                onChange={this.onChange('estimatedDeliveryDateYear')}
                className="cfnext-select-box"
                aria-invalid={Boolean(validation.estimatedDeliveryDate)}>
                {years.map(year => {
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>

              {validation.estimatedDeliveryDate && (
                <div className="cfnext-form__field-error validation-error">
                  <Icon
                    icon="ErrorCircle"
                    color="negative"
                    style={{
                      marginRight: '7px',
                      marginBottom: '-4px'
                    }}
                  />
                  <span>{validation.estimatedDeliveryDate}</span>
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </Fragment>
    );
  }
}
