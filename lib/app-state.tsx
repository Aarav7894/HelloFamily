import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { formatShortDate, isoDate, startOfToday } from "@/lib/dates";
import type {
  CheckInHistoryEntry,
  CheckInResponses,
  CheckInStatus,
} from "@/lib/sample-data";
import {
  deriveDashboardStatus,
  sampleCheckInHistory,
  sampleOlderAdult,
} from "@/lib/sample-data";

type AppState = {
  olderAdultName: string;
  history: CheckInHistoryEntry[];
  todayStatus: CheckInStatus;
  completeCheckIn: (responses: CheckInResponses) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [todayResponses, setTodayResponses] = useState<CheckInResponses | null>(
    null,
  );

  const completeCheckIn = useCallback((responses: CheckInResponses) => {
    setTodayResponses(responses);
  }, []);

  const history = useMemo<CheckInHistoryEntry[]>(() => {
    const today = startOfToday();
    return [
      ...sampleCheckInHistory,
      {
        date: isoDate(today),
        label: formatShortDate(today, 0),
        responses: todayResponses,
      },
    ];
  }, [todayResponses]);

  const todayStatus = useMemo(() => deriveDashboardStatus(history), [history]);

  const value = useMemo<AppState>(
    () => ({
      olderAdultName: sampleOlderAdult.name,
      history,
      todayStatus,
      completeCheckIn,
    }),
    [history, todayStatus, completeCheckIn],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
