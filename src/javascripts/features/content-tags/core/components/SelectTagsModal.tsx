import * as React from 'react';
import { useCallback, useState } from 'react';
import { Button, Modal, Spinner } from '@contentful/forma-36-react-components';
import { ModalProps } from '@contentful/forma-36-react-components/dist/components/Modal/Modal';
import { useIsInitialLoadingOfTags } from '../hooks';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { FilteredTagsProvider, MetadataTags, orderByLabel } from 'features/content-tags';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { TagSelectionValue } from '../Types';

const styles = {
  button: css({
    marginRight: tokens.spacingS,
  }),
  loading: css({
    marginRight: 'auto',
    marginLeft: 'auto',
    marginTop: tokens.spacing4Xl,
    marginBottom: tokens.spacing4Xl,
    width: '100%',
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
  selectedTags: TagSelectionValue[];
  modalProps?: ModalLabelProps;
} & Pick<ModalProps, 'onClose' | 'isShown'>;

const SelectTagsModal: React.FC<Props> = ({ isShown, onClose, selectedTags, modalProps }) => {
  const mProps = {
    title: 'Select tags',
    selectLabel: 'Tags',
    submitLabel: 'Accept selection',
    ...modalProps,
  };

  const isInitialLoad = useIsInitialLoadingOfTags();
  const [localTags, setLocalTags] = useState<{ value: string; label: string }[]>(selectedTags);

  const onAdd = useCallback(
    (selection: TagSelectionValue) => {
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

  return (
    <Modal isShown={isShown} onClose={() => onPopupClose(true)} title={mProps.title}>
      <div>
        {isInitialLoad ? (
          <div>
            <Spinner className={styles.loading} />
          </div>
        ) : (
          <FilteredTagsProvider>
            <TagsSelection
              label={mProps.selectLabel}
              selectedTags={localTags}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          </FilteredTagsProvider>
        )}
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
      </div>
    </Modal>
  );
};

const selectTags = async (
  selectedTags: TagSelectionValue[],
  modalProps: ModalLabelProps
): Promise<{ canceled: boolean; tags: TagSelectionValue[] }> => {
  return await ModalLauncher.open(({ onClose, isShown }) => (
    <SpaceEnvContextProvider>
      <MetadataTags>
        <SelectTagsModal
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