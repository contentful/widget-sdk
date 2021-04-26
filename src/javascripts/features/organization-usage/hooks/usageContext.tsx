import React, { createContext, useReducer, Dispatch, Context, ReactNode } from 'react';
import { mapResponseToState } from '../services/UsageService';
import { periodToDates, PeriodToDatesArgs, PeriodToDatesResponse } from '../utils/periodToDates';
import { sum, get } from 'lodash';
import { noop } from 'lodash/fp';

export const colours = ['#2E75D4', '#0EB87F', '#EA9005', '#8C53C2', '#CC3C52'];

type UsageContextStateType = {
  isLoading: boolean;
  error?: Error | null | undefined;
  isAssetBandwidthTab: boolean;
  selectedMainTab: string;
  selectedPeriodIndex: number;
  selectedSpacesTab: string;
  isTeamOrEnterpriseCustomer?: boolean;
  periodDates?: PeriodToDatesResponse;
  periodicUsage?: {
    org: {
      usage: number[];
    };
    apis: any;
  };
  totalUsage?: number;
  apiRequestIncludedLimit?: number;
  assetBandwidthData?: {
    usage: any;
    limit: any;
    uom: any;
  };
  spaceNames: Record<string, string>;
  spaceTypeLookup: Record<string, any>;
  periods: PeriodToDatesArgs[];
  hasSpaces?: boolean;
  orgId?: string;
};

export const initialState = {
  isLoading: true,
  error: null,
  isAssetBandwidthTab: false,
  selectedMainTab: 'apiRequest',
  selectedPeriodIndex: 0,
  selectedSpacesTab: 'cma',
  spaceNames: {},
  spaceTypeLookup: {},
  periods: [] as PeriodToDatesArgs[],
};

export const UsageStateContext = createContext(initialState) as Context<UsageContextStateType>;
export const UsageDispatchContext = createContext(noop) as Context<Dispatch<any>>;

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER_TYPE': {
      return { ...state, isTeamOrEnterpriseCustomer: action.value };
    }
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
      const assetBandwidthData = {
        usage: get(action.value, ['usage']),
        limit: get(action.value, ['limits', 'included']),
        uom: get(action.value, ['unitOfMeasure']),
      };
      return { ...state, assetBandwidthData };
    }
    case 'CHANGE_PERIOD': {
      return {
        ...state,
        selectedPeriodIndex: action.value,
        periodDates: periodToDates(state.periods[action.value]),
      };
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
    case 'SET_ERROR': {
      return { ...state, error: action.value };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

type UsageProviderProps = {
  children: ReactNode;
  orgId: string;
};

export const UsageProvider = ({ children, orgId }: UsageProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <UsageStateContext.Provider value={{ ...state, orgId }}>
      <UsageDispatchContext.Provider value={dispatch}>{children}</UsageDispatchContext.Provider>
    </UsageStateContext.Provider>
  );
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
