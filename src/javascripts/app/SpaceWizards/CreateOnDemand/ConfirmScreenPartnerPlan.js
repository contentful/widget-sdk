import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import moment from 'moment';
import Datepicker from '@contentful/forma-36-react-datepicker';

import {
  Paragraph,
  TextField,
  Form,
  Typography,
  Button,
  Heading,
} from '@contentful/forma-36-react-components';

const styles = {
  fieldset: css({
    border: '1px solid #d3dce0',
    padding: '0 10px',
    margin: '20px 0 0',
    borderRadius: '2px',
  }),
  confirmButton: css({
    margin: '1.2em 0',
    textAlign: 'center',
  }),
  center: css({
    textAlign: 'center',
  }),
};

export default function ConfirmScreenPartnerPlan(props) {
  const {
    selectedTemplate,
    creating,
    onConfirm,
    organization,
    spaceName,
    partnerDetails,
    onChangePartnerDetails,
  } = props;

  return (
    <Typography>
      <Heading className={styles.center}>Confirm your selection</Heading>
      <Paragraph className={styles.center}>
        Make sure everything is in order before creating your space.
      </Paragraph>
      <Paragraph>
        You’re about to create a space for the organization <em>{organization.name}</em>. The
        space’s name will be <em>{spaceName}</em>
        {selectedTemplate && ', and we will fill it with example content'}
        {'. '}
        Before you do, please give us a few more details about this space. These details will be
        sent to your partnership manager.
      </Paragraph>
      <fieldset className={styles.fieldset}>
        <legend>Project information</legend>
        <Form>
          <TextField
            labelText="Client name"
            name="clientName"
            id="clientName"
            value={partnerDetails.clientName}
            required
            onChange={(e) => onChangePartnerDetails('clientName', e.target.value)}
          />
          <TextField
            labelText="Short project description"
            name="description"
            id="description"
            value={partnerDetails.projectDescription}
            required
            onChange={(e) => onChangePartnerDetails('projectDescription', e.target.value)}
          />
          <Datepicker
            onChange={(date) => {
              onChangePartnerDetails('estimatedDeliveryDate', moment(date).format('YYYY-MM-DD'));
            }}
            labelText="Estimated Delivery Date"
            required
            value={partnerDetails.estimatedDeliveryDate}
            dateFormat="YYYY-MM-DD"
            minDate={moment().toDate()}
            data-test-id="date"
          />
        </Form>
      </fieldset>
      <div className={styles.confirmButton}>
        <Button disabled={creating} loading={creating} onClick={onConfirm} buttonType="positive">
          Confirm and create space
        </Button>
      </div>
    </Typography>
  );
}

ConfirmScreenPartnerPlan.propTypes = {
  selectedTemplate: PropTypes.object,
  creating: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  organization: PropTypes.object.isRequired,
  spaceName: PropTypes.string.isRequired,
  onChangePartnerDetails: PropTypes.func.isRequired,
  partnerDetails: PropTypes.shape({
    clientName: PropTypes.string.isRequired,
    projectDescription: PropTypes.string.isRequired,
    estimatedDeliveryDate: PropTypes.string.isRequired,
  }),
};
