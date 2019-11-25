import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Paragraph,
  Typography,
  EntityList,
  EntityListItem
} from '@contentful/forma-36-react-components';
import EntityStateLink from 'app/common/EntityStateLink';
import * as AssetUrlService from 'services/AssetUrlService';

const ConfirmInsertAssetModal = ({ isShown, onClose, assets, locale }) => {
  const localesNumber = assets.length;
  const modalTitle =
    localesNumber === 1
      ? `Asset is missing a file in locale ${locale}`
      : `Assets are missing files in locale ${locale}`;

  return (
    <Modal title={modalTitle} isShown={isShown} onClose={onClose}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Typography>
              <Paragraph>
                {localesNumber === 1
                  ? `Link asset with missing file for locale ${locale}`
                  : `Link assets with missing files for locale ${locale}`}
              </Paragraph>
              <Paragraph>
                {localesNumber === 1
                  ? 'Do you want to link to the file in its fallback locale?'
                  : 'Do you want to link to the files in their fallback locales?'}
              </Paragraph>
            </Typography>
            <EntityList>
              {assets.map(
                ({ title, description, thumbnailUrl, thumbnailAltText, asset }, index) => (
                  <EntityStateLink key={index} entity={asset}>
                    {({ getHref }) => (
                      <EntityListItem
                        title={title}
                        thumbnailUrl={`${AssetUrlService.transformHostname(
                          thumbnailUrl
                        )}?w=46&h=46&fit=thumb`}
                        thumbnailAltText={thumbnailAltText}
                        description={description}
                        onClick={() => {}}
                        href={getHref()}
                      />
                    )}
                  </EntityStateLink>
                )
              )}
            </EntityList>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="confirm-insert-asset"
              onClick={() => onClose(true)}
              buttonType="positive">
              Confirm
            </Button>
            <Button onClick={() => onClose(false)} buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default ConfirmInsertAssetModal;

ConfirmInsertAssetModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      thumbnailUrl: PropTypes.string.isRequired,
      thumbnailAltText: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      asset: PropTypes.object.isRequired
    }).isRequired
  ).isRequired,
  locale: PropTypes.string.isRequired
};
