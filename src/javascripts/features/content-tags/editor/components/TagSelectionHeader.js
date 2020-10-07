import PropTypes from 'prop-types';
import { Paragraph } from '@contentful/forma-36-react-components';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import FeedbackButton from 'app/common/FeedbackButton';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useCanManageTags, useF36Modal, useReadTags } from 'features/content-tags/core/hooks';
import { AdminsOnlyModal } from 'features/content-tags/editor/components/AdminsOnlyModal';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import * as Navigator from 'states/Navigator';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  iconWrapper: css({
    marginLeft: tokens.spacingL,
    order: '2',
  }),
  tagLimits: css({
    marginLeft: 'auto',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagSelectionHeader = ({ totalSelected }) => {
  const { currentEnvironment } = useSpaceEnvContext();
  const { isLoading, hasTags } = useReadTags();
  const canManageTags = useCanManageTags();

  const { showModal: showUserListModal, modalComponent: userListModal } = useF36Modal(
    AdminsOnlyModal
  );

  const onCreate = useCallback(() => {
    if (canManageTags) {
      const isMaster = isMasterEnvironment(currentEnvironment);
      Navigator.go({ path: `spaces.detail.${isMaster ? '' : 'environment.'}settings.tags` });
    } else {
      showUserListModal();
    }
  }, [canManageTags, showUserListModal, currentEnvironment]);

  const renderNoTags = useMemo(() => {
    return (
      <React.Fragment>
        {userListModal}
        <NoTagsContainer onCreate={onCreate} buttonLabel={'Add tags'} />
      </React.Fragment>
    );
  }, [onCreate, userListModal]);

  if (!hasTags && !isLoading) {
    return renderNoTags;
  }

  return (
    <div className={styles.wrapper}>
      <Paragraph>
        {totalSelected} / {TAGS_PER_ENTITY}
      </Paragraph>
      <Paragraph>
        <FeedbackButton about="Tags" target="devWorkflows" label="Give feedback" />
      </Paragraph>
    </div>
  );
};

TagSelectionHeader.propTypes = {
  totalSelected: PropTypes.number,
};

export { TagSelectionHeader };
