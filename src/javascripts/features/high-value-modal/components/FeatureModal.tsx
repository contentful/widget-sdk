import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Button, Modal } from '@contentful/forma-36-react-components';
import { ContentfulRichText } from 'core/services/ContentfulCDA';
import { Document } from '@contentful/rich-text-types';

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
              <div>Illustration placeholder</div>
              <ContentfulRichText document={longDescription} />
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
