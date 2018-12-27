import { when } from 'jest-when';

import spaceContext from './ng/spaceContext';
import $state from './ng/$state';
import logger from './ng/logger';
import TheLocaleStore from './ng/TheLocaleStore';
import modalDialog from './ng/modalDialog';
import contentPreview from './ng/contentPreview';

export const getModule = jest.fn();

when(getModule)
  .calledWith('spaceContext')
  .mockReturnValue(spaceContext)
  .calledWith('$state')
  .mockReturnValue($state)
  .calledWith('logger')
  .mockReturnValue(logger)
  .calledWith('TheLocaleStore')
  .mockReturnValue(TheLocaleStore)
  .calledWith('modalDialog')
  .mockReturnValue(modalDialog)
  .calledWith('contentPreview')
  .mockReturnValue(contentPreview);
