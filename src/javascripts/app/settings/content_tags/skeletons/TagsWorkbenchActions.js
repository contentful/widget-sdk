import * as React from 'react';
import { Button, TextInput } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import useReadTags from '../hooks/useReadTags';
import useCreateTagModal from '../components/CreateTagModal';
import { useCallback } from 'react';
import useF36Modal from '../hooks/useF36Modal';

const styles = {
  search: css({
    maxWidth: '1100px',
    marginLeft: '79px',
    paddingLeft: tokens.spacingL,
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex',
  }),
  ctaWrapper: css({
    paddingLeft: tokens.spacingL,
    marginLeft: 'auto',
    display: 'flex',
  }),
};

function TagsWorkbenchActions() {
  const { search, setSearch, setSkip } = useReadTags();
  const { modalComponent: createTagComponent, showModal: setTagComponentActive } = useF36Modal(
    useCreateTagModal
  );

  const onCreate = useCallback(() => {
    setTagComponentActive();
  }, [setTagComponentActive]);

  const onSearch = useCallback(
    (event) => {
      setSkip(0);
      setSearch(event.target.value);
    },
    [setSearch, setSkip]
  );

  return (
    <div className={styles.actionsWrapper}>
      {createTagComponent}
      <TextInput
        className={styles.search}
        autoFocus
        type="search"
        placeholder="Search for tags"
        onChange={onSearch}
        value={search}
      />
      <div className={styles.ctaWrapper}>
        <Button onClick={onCreate} buttonType="primary" testId="tags.add">
          Create Tag
        </Button>
      </div>
    </div>
  );
}

export default TagsWorkbenchActions;
