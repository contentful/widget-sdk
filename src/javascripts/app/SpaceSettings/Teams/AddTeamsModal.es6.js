import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal, Spinner } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';

import useAsync from 'app/common/hooks/useAsync.es6';

const fetch = async () => {
  const $stateParams = getModule('$stateParams');
  console.log($stateParams);
};

export default function AddTeamsModal({ isShown, onClose }) {
  const { isLoading, error, data } = useAsync(useCallback(fetch, [onClose]));

  return (
    <Modal title="Add teams" isShown={isShown} onClose={onClose}>
      <>
        {isLoading && <Spinner />}
        {error && <h1>Oops, an error happened</h1>}
        {!data && !error && <Spinner />}
        {data && <h1>Teams</h1>}
      </>
    </Modal>
  );
}

AddTeamsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
