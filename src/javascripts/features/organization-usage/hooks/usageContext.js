import React from 'react';
import { mapResponseToState } from '../services/UsageService';
import { periodToDates } from '../utils/periodToDates';
import { sum } from 'lodash';
import PropTypes from 'prop-types';

export const colours = ['#2E75D4', '#0EB87F', '#EA9005', '#8C53C2', '#CC3C52'];

const initialState = {
  isLoading: true,
  error: null,
  isAssetBandwidthTab: false,
  selectedMainTab: 'apiRequest',
  selectedPeriodIndex: 0,
  selectedSpacesTab: 'cma',
};

const UsageStateContext = React.createContext();
const UsageDispatchContext = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORG_DATA': {
      const { periods } = action.value;
      const periodDates = periodToDates(periods[state.selectedPeriodIndex]);
      return {
        ...state,
        ...action.value,
        periodDates,
      };
    }
    case 'SET_USAGE_DATA': {
      const { periodicUsage } = mapResponseToState(action.value);
      const totalUsage = sum(periodicUsage.org.usage);
      return { ...state, periodicUsage, totalUsage };
    }
    case 'SET_ASSET_BANDWIDTH_DATA': {
      return { ...state, assetBandwidthData: action.value };
    }
    case 'CHANGE_PERIOD': {
      return { ...state, selectedPeriodIndex: action.value };
    }
    case 'SET_LOADING': {
      return { ...state, isLoading: action.value };
    }
    case 'SWITCH_MAIN_TAB': {
      return {
        ...state,
        selectedMainTab: action.value,
        isAssetBandwidthTab: action.value === 'assetBandwidth',
      };
    }
    case 'SWITCH_SPACES_TAB': {
      return { ...state, selectedSpacesTab: action.value };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

export const UsageProvider = ({ children, orgId }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <UsageStateContext.Provider value={{ ...state, orgId }}>
      <UsageDispatchContext.Provider value={dispatch}>{children}</UsageDispatchContext.Provider>
    </UsageStateContext.Provider>
  );
};

UsageProvider.propTypes = {
  orgId: PropTypes.string,
};

export const useUsageState = () => {
  const context = React.useContext(UsageStateContext);
  if (!context) {
    throw new Error('useUsageState must be used within a UsageProvider');
  }
  return context;
};

export const useUsageDispatch = () => {
  const context = React.useContext(UsageDispatchContext);
  if (!context) {
    throw new Error('useUsageDispatch must be used within a UsageProvider');
  }
  return context;
};
