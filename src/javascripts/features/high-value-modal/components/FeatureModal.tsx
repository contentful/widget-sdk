import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Button, Modal, Flex } from '@contentful/forma-36-react-components';
import { ContentfulRichText, ContentfulImage } from 'core/services/ContentfulCDA';
import { Document } from '@contentful/rich-text-types';
import { Asset } from 'contentful';

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
}: ModalFeatureContentProps) => {
  return (
    <Modal isShown={isShown} onClose={onClose} size="large">
      {() => (
        <div>
          <Modal.Header title={`${name}`} onClose={onClose} />
          <Modal.Content>
            <>
              <Flex justifyContent="center" marginBottom="spacingM">
                <ContentfulImage image={illustration} />
              </Flex>
              <Flex marginBottom="spacingM" flexDirection="column">
                <ContentfulRichText document={longDescription} />
              </Flex>
            </>
          </Modal.Content>
          <Modal.Controls position="right" className={styles.modalControllsFullWith}>
            <Button buttonType="muted" href={learnMore} className={styles.buttonWithSpaceRight}>
              {secondaryCtaForAdmins}
            </Button>
            <Button buttonType="primary" href={helpCenterUrl}>
              {primaryCtaAdmins}
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

export { FeatureModal };
