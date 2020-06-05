import { useState } from 'react';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const migrateLegacyAndGetStore = () => {
  const browserStorage = getBrowserStorage();
  const legacyStore = browserStorage.forKey('folderStates');
  const legacyValue = legacyStore?.get();
  legacyStore?.remove();

  const store = browserStorage.forKey('cf_webapp_folderstates');
  if (legacyValue) {
    store.set(legacyValue);
  }
  return store;
};

const folderStore = migrateLegacyAndGetStore();

const getFolderState = () => folderStore?.get() || {};
const getIsClosedForFolder = ({ id }) => !!getFolderState()[id];
const setIsClosedForFolder = ({ id }, isClosed) => {
  const state = getFolderState();
  state[id] = isClosed;
  folderStore?.set(state);
};

const useFolder = () => {
  const [isClosed, setClosed] = useState(getFolderState());

  const toggleClosed = (folder) => {
    const state = getIsClosedForFolder(folder);
    setIsClosedForFolder(folder, !state);
    setClosed((prev) => ({ ...prev, [folder.id]: !state }));
  };

  return [{ isClosed }, { toggleClosed }];
};

export default useFolder;
