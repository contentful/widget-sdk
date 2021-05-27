import { useState } from 'react';
import constate from 'constate';

const useFieldDialog = () => {
  const [] = useState();
};

const [FieldDialogProvider, useFieldDialogContext] = constate(useFieldDialog);

export { FieldDialogProvider, useFieldDialogContext };
