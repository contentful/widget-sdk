let currentReactRouteName: string | null = null;

const setCurrentReactRouteName = (value: string | null) => {
  currentReactRouteName = value;
};

const getCurrentReactRouteName = () => {
  return currentReactRouteName;
};

export const RouteNameCursor = {
  setCurrentReactRouteName,
  getCurrentReactRouteName,
};
