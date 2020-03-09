import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Form,
  FieldGroup,
  RadioButtonField,
  Paragraph,
  Textarea,
  Note,
  Notification,
  Button,
  Subheading
} from '@contentful/forma-36-react-components';
import createMicroBackendsClient from 'MicroBackendsClient';
import tokens from '@contentful/forma-36-tokens';
import { getUserInfo } from './referencesDialogService';

const styles = {
  form: css({ marginTop: tokens.spacingM }),
  optionYes: css({ marginRight: tokens.spacingS }),
  buttonWrapper: css({ display: 'flex' }),
  textAreaHeader: css({
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingS
  })
};

const textFieldMaxLength = 1024;

const FeedbackForm = ({ onClose }) => {
  const [isUseful, setIsUseful] = useState(null);
  const [commentValue, setCommentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canBeContacted, setCanBeContacted] = useState(true);
  const [isCommentFieldVisible, setIsCommentFieldVisibile] = useState(false);

  const sendFeedbackForm = async ({ feedback }) => {
    const client = createMicroBackendsClient({ backendName: 'feedback' });
    setIsSubmitting(true);

    const userData = {};
    if (canBeContacted) {
      Object.assign(userData, getUserInfo());
    }
    const res = await client.call('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about: 'Publish all references',
        target: 'cxPulitzerReleases',
        feedback,
        ...userData
      })
    });
    setIsSubmitting(false);
    onClose();

    if (res.ok) {
      Notification.success('Thank you for your feedback!');
    } else {
      Notification.error("We couldn't send your feedback. Please try again.");
    }
  };

  const isAnswerPositive = isUseful === 'yes';

  return (
    <div className={styles.form}>
      <Note>
        <Form
          onSubmit={() =>
            sendFeedbackForm({
              feedback: `Would you feel confident publishing all these references together?: ${isUseful}, comment: ${commentValue ||
                `none`}`
            })
          }
          spacing="condensed">
          <Paragraph>
            <b>Would you feel confident publishing all these references together?</b>
          </Paragraph>
          <div>
            <RadioButtonField
              labelText="Yes"
              id="yes"
              className={styles.optionYes}
              value="yes"
              checked={isAnswerPositive}
              onChange={e => {
                setIsUseful(e.target.value);
                setIsCommentFieldVisibile(true);
              }}
            />
            <RadioButtonField
              labelText="No"
              value="no"
              id="no"
              checked={isUseful === 'no'}
              onChange={e => {
                setIsUseful(e.target.value);
                setIsCommentFieldVisibile(true);
              }}
            />
          </div>
          {isCommentFieldVisible && (
            <>
              <Subheading className={styles.textAreaHeader}>
                {isAnswerPositive ? 'Why?' : 'Why not?'}
              </Subheading>
              <FieldGroup>
                <Textarea
                  placeholder={
                    isAnswerPositive
                      ? 'I feel confident because...'
                      : "I don't feel confident because..."
                  }
                  maxLength={textFieldMaxLength}
                  onChange={e => setCommentValue(e.target.value.substr(0, textFieldMaxLength))}
                  value={commentValue}
                />
              </FieldGroup>
              <FieldGroup>
                <RadioButtonField
                  labelText="Include my contact information in the feedback"
                  helpText="We might reach out with some additional questions"
                  checked={canBeContacted}
                  onChange={() => setCanBeContacted(true)}
                  name="can-be-contacted"
                  id="can-be-contacted"
                />
                <RadioButtonField
                  labelText="Make it anonymous"
                  helpText="Your contact information won't be included in the feedback"
                  checked={!canBeContacted}
                  onChange={() => setCanBeContacted(false)}
                  name="anonymous"
                  id="anonymous"
                />
              </FieldGroup>
            </>
          )}
          <div className={styles.buttonWrapper}>
            <Button type="submit" loading={isSubmitting} disabled={!isCommentFieldVisible}>
              Submit
            </Button>
            <Button onClick={onClose} buttonType="muted">
              Close
            </Button>
          </div>
        </Form>
      </Note>
    </div>
  );
};

FeedbackForm.propTypes = {
  onClose: PropTypes.func
};

export default FeedbackForm;
