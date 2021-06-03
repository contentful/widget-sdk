import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DisplayText,
  Flex,
  Modal,
  Notification,
  ModalLauncher,
} from '@contentful/forma-36-react-components';
import * as TokenStore from 'services/TokenStore';
import { css } from 'emotion';
import { track } from 'analytics/Analytics';
import TemplatesList from 'app/SpaceWizards/shared/TemplatesList';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { useAsync } from 'core/hooks/useAsync';
import { LoadingCard } from './LoadingCard';
import { applyTemplateToSpace, SelectedTemplate } from 'features/space-purchase';
import { ReplaceSpaceDialog } from './ReplaceSpaceDialog';
import { router } from 'core/react-routing';
import { renameSpace } from '../utils/util';

const styles = {
  container: css({
    maxWidth: 736,
  }),
};

const fetchData = () => async () => {
  const templatesList = await getTemplatesList();
  return { templatesList };
};

export const SampleSpaceDialog = ({ onClose, onBack, spaceId, replaceSpace = false }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate>();
  const [loading, setLoading] = useState(false);

  const showReplaceSpaceWarning = async () => {
    onClose();
    await ModalLauncher.open(({ onClose }) => (
      <ReplaceSpaceDialog isShown onConfirm={applyTemplate} onClose={onClose} spaceId={spaceId} />
    ));
  };

  const handleContinue = async (spaceId) => {
    if (replaceSpace) {
      showReplaceSpaceWarning();
    } else {
      setLoading(true);
      try {
        await applyTemplate(spaceId);
      } finally {
        setLoading(false);
        onClose();
      }
    }
  };

  const applyTemplate = async (spaceId) => {
    const space = await TokenStore.getSpace(spaceId);
    if (selectedTemplate && space) {
      track('onboarding_sample_space:continue', {
        templateName: `${selectedTemplate?.name}`,
      });

      try {
        renameSpace(selectedTemplate.name, spaceId);
        await applyTemplateToSpace(space, selectedTemplate);
      } finally {
        router.navigate({ path: 'content_types.list', spaceId });
        Notification.success('You have successfully created a pre-built space.');
      }
    }
  };

  const { isLoading, data } = useAsync(useCallback(fetchData(), []));

  useEffect(() => {
    // if templates are visible, select the first one by default
    if (data?.templatesList && !selectedTemplate) {
      setSelectedTemplate(data?.templatesList[0]);
    }
  }, [selectedTemplate, setSelectedTemplate, data]);

  return (
    <Modal.Content className={styles.container}>
      {isLoading && <LoadingCard />}
      {!isLoading && data?.templatesList && (
        <>
          <Flex marginBottom="spacing3Xl">
            <DisplayText>Choose and create a space</DisplayText>
          </Flex>
          <Flex marginBottom="spacingL">
            <TemplatesList
              templates={data?.templatesList}
              selectedTemplate={selectedTemplate}
              onSelect={(template) => setSelectedTemplate(template)}
              isNewSpacePurchaseFlow={true}
            />
          </Flex>
          <Flex justifyContent="flex-end" marginBottom="spacingM">
            <Flex flexDirection="column" marginRight="spacingM">
              <Button
                buttonType="muted"
                onClick={() => {
                  track('onboarding_sample_space:back');
                  onBack();
                }}
                testId="back-btn">
                Back
              </Button>
            </Flex>
            <Flex>
              <Button
                buttonType="primary"
                loading={loading}
                disabled={!selectedTemplate || loading}
                onClick={() => handleContinue(spaceId)}
                testId="continue-btn">
                Continue
              </Button>
            </Flex>
          </Flex>
        </>
      )}
    </Modal.Content>
  );
};