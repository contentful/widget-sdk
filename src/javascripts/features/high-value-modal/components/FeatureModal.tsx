import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Button, Modal, Flex, Typography } from '@contentful/forma-36-react-components';
import { ContentfulRichText, ContentfulImage } from 'core/services/ContentfulCDA';
import { Document } from '@contentful/rich-text-types';
import { Asset } from 'contentful';
import { track } from 'analytics/Analytics';

const styles = {
  // TODO: fix in F36
  modalControllsFullWith: css({
    width: '100%',
  }),
  buttonWithSpaceRight: css({
    marginRight: tokens.spacingS,
  }),
};

interface ModalFeatureContentProps {
  isShown: boolean;
  onClose: () => boolean;
  name: string;
  illustration: Asset;
  longDescription: Document;
  primaryCtaAdmins: string;
  helpCenterUrl: string;
  secondaryCtaForAdmins: string;
  learnMore: string;
  featureTracking: string;
}

// Content displayed in the modal is fetched from Contentful ProdDev space.
// To fetch content use fetchWebappContentByEntryID('your_entry_id) function
const FeatureModal = ({
  isShown,
  onClose,
  name,
  illustration,
  longDescription,
  primaryCtaAdmins,
  helpCenterUrl,
  secondaryCtaForAdmins,
  learnMore,
  featureTracking,
}: ModalFeatureContentProps) => {
  const handleOnClick = (cta) => {
    track(`high_value_feature:modal_${cta}`, {
      userType: 'community',
      feature: featureTracking,
    });
  };

  const handleOnClose = () => {
    track(`high_value_feature:modal_close`, {
      userType: 'community',
      feature: featureTracking,
    });
    onClose();
  };

  return (
    <Modal isShown={isShown} onClose={handleOnClose} size="medium">
      {() => (
        <div>
          <Modal.Header title={`${name}`} onClose={handleOnClose} />
          <Modal.Content>
            <>
              <Flex justifyContent="center" marginBottom="spacingM">
                <ContentfulImage image={illustration} />
              </Flex>
              <Flex flexDirection="column">
                <Typography>
                  <ContentfulRichText document={longDescription} />
                </Typography>
              </Flex>
            </>
          </Modal.Content>
          <Modal.Controls position="right" className={styles.modalControllsFullWith}>
            <Button
              buttonType="muted"
              href={learnMore}
              onClick={() => handleOnClick('learn_more_cta')}
              className={styles.buttonWithSpaceRight}>
              {secondaryCtaForAdmins}
            </Button>
            <Button
              buttonType="primary"
              href={helpCenterUrl}
              onClick={() => handleOnClick('help_center_cta')}>
              {primaryCtaAdmins}
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

export { FeatureModal };
