import * as React from 'react';
import { useCallback, useState } from 'react';
import { Button, Modal, ModalLauncher, Spinner } from '@contentful/forma-36-react-components';
import { ModalProps } from '@contentful/forma-36-react-components/dist/components/Modal/Modal';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { go } from 'states/Navigator';
import { TagOption } from 'features/content-tags/types';
import { useIsInitialLoadingOfTags } from 'features/content-tags/core/hooks/useIsInitialLoadingOfTags';
import { useCanManageTags } from 'features/content-tags/core/hooks/useCanManageTags';
import { useReadTags } from 'features/content-tags/core/hooks/useReadTags';
import { FilteredTagsProvider } from 'features/content-tags/core/state/FilteredTagsProvider';
import { orderByLabel } from 'features/content-tags/editor/utils';
import { MetadataTags } from 'features/content-tags/core/state/MetadataTags';

const styles = {
  button: css({
    marginRight: tokens.spacingS,
  }),
  loading: css({
    marginRight: 'auto',
    marginLeft: 'auto',
    marginTop: tokens.spacing4Xl,
    marginBottom: tokens.spacing4Xl,
  }),
  help: css({
    marginRight: tokens.spacingXs,
  }),
  helpIconContainer: css({
    height: 18,
  }),
};

type ModalLabelProps = {
  title?: string;
  selectLabel?: string;
  submitLabel?: string;
};

type Props = {
  hasInlineTagCreation?: boolean;
  selectedTags: TagOption[];
  modalProps?: ModalLabelProps;
} & Pick<ModalProps, 'onClose' | 'isShown'>;

// make inline creation configurable
const SelectTagsModal: React.FC<Props> = ({
  isShown,
  onClose,
  selectedTags,
  hasInlineTagCreation,
  modalProps,
}) => {
  const mProps = {
    title: 'Select tags',
    selectLabel: 'Tags',
    submitLabel: 'Accept selection',
    ...modalProps,
  };

  const isInitialLoad = useIsInitialLoadingOfTags();
  const [localTags, setLocalTags] = useState<{ value: string; label: string }[]>(selectedTags);

  const { hasTags } = useReadTags();
  const canManageTags = useCanManageTags();
  const { currentEnvironment } = useSpaceEnvContext();

  const onAdd = useCallback(
    (selection: TagOption) => {
      setLocalTags((prevState) => orderByLabel([selection, ...prevState]));
    },
    [setLocalTags]
  );

  const onRemove = useCallback(
    (id) => {
      setLocalTags((prevState) => orderByLabel([...prevState.filter((tag) => tag.value !== id)]));
    },
    [setLocalTags]
  );

  const onPopupClose = useCallback(
    (canceled) => {
      onClose({ canceled, tags: localTags.map((tag) => tag.value) });
    },
    [localTags, onClose]
  );

  const onCreate = useCallback(() => {
    if (canManageTags) {
      const isMaster = isMasterEnvironment(currentEnvironment);
      go({ path: `spaces.detail.${isMaster ? '' : 'environment.'}settings.tags` });
      onPopupClose(true);
    }
  }, [canManageTags, currentEnvironment, onPopupClose]);

  return (
    <Modal isShown={isShown} onClose={() => onPopupClose(true)} title={mProps.title}>
      <div data-test-id={'select-tags-modal'}>
        {isInitialLoad ? (
          <div>
            <Spinner className={styles.loading} />
          </div>
        ) : hasTags ? (
          <>
            <FilteredTagsProvider>
              <TagsSelection
                label={mProps.selectLabel}
                selectedTags={localTags}
                onAdd={onAdd}
                onRemove={onRemove}
                hasInlineTagCreation={hasInlineTagCreation}
              />
            </FilteredTagsProvider>
            <Button
              className={styles.button}
              testId={'create-content-tag-submit-button'}
              onClick={() => onPopupClose(false)}
              type="submit"
              disabled={isInitialLoad}
              buttonType="positive">
              {mProps.submitLabel}
            </Button>
            <Button
              testId={'create-content-tag-cancel-button'}
              onClick={() => onPopupClose(true)}
              type="reset"
              buttonType="muted">
              Cancel
            </Button>
          </>
        ) : (
          <NoTagsContainer buttonLabel="Add tags" onCreate={onCreate} />
        )}
      </div>
    </Modal>
  );
};

const selectTags = async (
  selectedTags: TagOption[],
  modalProps: ModalLabelProps
): Promise<{ canceled: boolean; tags: TagOption[] }> => {
  return await ModalLauncher.open(({ onClose, isShown }) => (
    <SpaceEnvContextProvider>
      <MetadataTags>
        <SelectTagsModal
          hasInlineTagCreation={true}
          isShown={isShown}
          onClose={onClose}
          selectedTags={selectedTags}
          modalProps={modalProps}
        />
      </MetadataTags>
    </SpaceEnvContextProvider>
  ));
};

export { SelectTagsModal, selectTags };
