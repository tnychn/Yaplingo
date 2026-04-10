import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type AxiosError } from "axios";

import client from "./client";
import type { HistoryEntry, StatsResponse } from "./models";

const GAMIFICATION_QUERY_KEY = ["gamification"] as const;

export const useXPHistoryQuery = (days: 7 | 30 = 30): UseQueryResult<HistoryEntry[], AxiosError> =>
  useQuery<HistoryEntry[], AxiosError>({
    queryKey: [...GAMIFICATION_QUERY_KEY, "history", days],
    queryFn: async () => {
      const { data } = await client.get<HistoryEntry[]>(`/gamification/history?days=${days}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useStatsQuery = (): UseQueryResult<StatsResponse, AxiosError> =>
  useQuery<StatsResponse, AxiosError>({
    queryKey: [...GAMIFICATION_QUERY_KEY, "stats"],
    queryFn: async () => {
      const { data } = await client.get<StatsResponse>("/gamification/stats");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
