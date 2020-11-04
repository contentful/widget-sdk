import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Button,
  TextField,
  Workbench,
  Card,
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Price } from 'core/components/formatting';

const styles = {
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
  saveButton: css({
    marginLeft: '16px',
    overflow: 'visible',
  }),
  renameSpaceContainer: css({
    display: 'flex',
    marginTop: '1rem',
    alignItems: 'flex-end',
  }),
};

export class SpaceSettings extends React.Component {
  state = {
    isSaving: false,
    initialSpaceName: this.props.spaceName,
    spaceName: this.props.spaceName,
  };

  isSaveDisabled() {
    return !this.state.spaceName || this.state.spaceName === this.state.initialSpaceName;
  }

  onChangeSpaceName = (e) => {
    this.setState({ spaceName: e.target.value });
  };

  onSaveNewName = () => {
    const newSpaceName = this.state.spaceName;
    this.setState({ isSaving: true });
    this.props
      .save(newSpaceName)
      .then(() => {
        this.setState({ isSaving: false, initialSpaceName: newSpaceName });
      })
      .catch(() => {
        this.setState({ isSaving: false });
      });
  };

  render() {
    const {
      showDeleteButton,
      showChangeButton,
      onRemoveClick,
      spaceId,
      plan,
      onChangeSpace,
    } = this.props;

    return (
      <Workbench>
        <Workbench.Header
          title="Space settings"
          icon={<ProductIcon icon="Settings" size="large" />}
        />
        <Workbench.Content type="text">
          <Card className={styles.section} testId="space-information-card">
            <Typography>
              <Heading>General</Heading>
              <TextField
                name="space-id"
                id="space-id"
                labelText="Space ID:"
                testId="space-id-text-input"
                value={spaceId}
                textInputProps={{
                  disabled: true,
                  withCopyButton: true,
                }}
              />
              <div className={styles.renameSpaceContainer}>
                <TextField
                  name="space-name"
                  id="space-name"
                  labelText="Space name:"
                  testId="space-name-text-input"
                  value={this.state.spaceName}
                  onChange={this.onChangeSpaceName}
                />
                <Button
                  disabled={this.isSaveDisabled()}
                  onClick={this.onSaveNewName}
                  buttonType="positive"
                  loading={this.state.isSaving}
                  className={styles.saveButton}
                  testId="update-space">
                  Rename space
                </Button>
              </div>
            </Typography>
          </Card>
          {/* If there is no plan, this is a v1 pricing customer and we shouldn't display this card */}
          {plan && (
            <Card testId="upgrade-space-plan-card" className={styles.section}>
              <Typography>
                <Heading>Current space plan</Heading>
                <Paragraph testId="space-settings-page.plan-price">
                  <>
                    {plan.name} - <Price value={plan.price} unit="month" />
                  </>
                </Paragraph>

                {/* Only org admins and owners can change the space type */}
                {showChangeButton && (
                  <Button onClick={onChangeSpace} testId="upgrade-space-button">
                    Upgrade your space
                  </Button>
                )}
              </Typography>
            </Card>
          )}
          {showDeleteButton && (
            <Card testId="danger-zone-section-card" className={styles.section}>
              <Typography>
                <Heading>Danger zone</Heading>
                <Paragraph>
                  Once you delete this space, all of its contents and the space itself will be
                  removed.
                </Paragraph>

                <Button buttonType="negative" onClick={onRemoveClick} testId="delete-space">
                  Delete space and all its contents
                </Button>
              </Typography>
            </Card>
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}

SpaceSettings.propTypes = {
  onRemoveClick: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  plan: PropTypes.object,
  spaceName: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  showDeleteButton: PropTypes.bool.isRequired,
  showChangeButton: PropTypes.bool.isRequired,
};
