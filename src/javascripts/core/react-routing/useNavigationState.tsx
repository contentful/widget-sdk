import { useLocation } from 'react-router-dom';

export function useNavigationState<T extends unknown>() {
  const location = useLocation();
  return location.state as T | undefined;
}
