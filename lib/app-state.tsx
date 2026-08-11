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

export type UserRole = "adult-child" | "older-adult";

type AppState = {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  olderAdultName: string;
  history: CheckInHistoryEntry[];
  todayStatus: CheckInStatus;
  completeCheckIn: (responses: CheckInResponses) => void;
  reset: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [todayResponses, setTodayResponses] = useState<CheckInResponses | null>(
    null,
  );

  const setRole = useCallback((next: UserRole) => setRoleState(next), []);

  const completeCheckIn = useCallback((responses: CheckInResponses) => {
    setTodayResponses(responses);
  }, []);

  const reset = useCallback(() => {
    setRoleState(null);
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
      role,
      setRole,
      olderAdultName: sampleOlderAdult.name,
      history,
      todayStatus,
      completeCheckIn,
      reset,
    }),
    [role, setRole, history, todayStatus, completeCheckIn, reset],
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
