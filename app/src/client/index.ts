import { useMutation, useQuery } from "@tanstack/react-query";
import { getCalendars, getLocales } from "expo-localization";
import { type AxiosError, type AxiosRequestConfig } from "axios";
import { useSetAtom } from "jotai";

import { $token } from "../store";
import client from "./client";
import type {
  AchievementResponse,
  ActiveEvent,
  ClaimAchievementRequest,
  ClaimAchievementResponse,
  GemBalanceResponse,
  GemConfigResponse,
  Leaderboard,
  SpendGemsRequest,
  SpendGemsResponse,
  UseSkillResponse,
  User,
  UserInventoryResponse,
  UserInsights,
} from "./models";

export const useCurrentUserQuery = ({ check = false }: { check?: boolean } = {}) =>
  useQuery<User, AxiosError>({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const options: AxiosRequestConfig = {
        timeout: 5000,
        validateStatus: (status) => [200, 401, 403].includes(status),
      };
      const response = await client.get("/user/@", check ? options : undefined);
      return response.data;
    },
    retry: true,
    staleTime: Infinity,
  });

export const useCurrentUserInsightsQuery = () =>
  useQuery<UserInsights | null, AxiosError>({
    queryKey: ["user", "me", "insights"],
    queryFn: async () => {
      const response = await client.get(`/user/@/insights`);
      return response.data;
    },
    staleTime: Infinity,
  });

export const useUserQuery = (uid: string) =>
  useQuery<User, AxiosError>({
    queryKey: ["user", uid],
    queryFn: async () => {
      const response = await client.get(`/user/${uid}`);
      return response.data;
    },
  });

export const useLoginMutation = () => {
  const setToken = useSetAtom($token);

  type Data = { token: string };
  type Variables = { username: string; password: string };

  return useMutation<Data, AxiosError, Variables>({
    mutationFn: async (credentials) => {
      const response = await client.post("/auth/login", {
        name: credentials.username,
        password: credentials.password,
      });
      return response.data;
    },
    onSuccess: ({ token }) => setToken(token),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: ["user", "me"] }),
  });
};

export const useRegisterMutation = () => {
  const setToken = useSetAtom($token);

  type Data = { token: string };
  type Variables = { username: string; password: string };

  return useMutation<Data, AxiosError, Variables>({
    mutationFn: async (data) => {
      const [locale] = getLocales();
      const [calendar] = getCalendars();
      const response = await client.post("/auth/register", {
        name: data.username,
        password: data.password,
        language: locale.languageCode,
        timezone: calendar.timeZone,
      });
      return response.data;
    },
    onSuccess: ({ token }) => setToken(token),
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: ["user", "me"] }),
  });
};

export const useLeaderboardQuery = () =>
  useQuery<Leaderboard, AxiosError>({
    queryKey: ["game", "leaderboard"],
    queryFn: async () => {
      const response = await client.get("/game/leaderboard");
      return response.data;
    },
  });

export const useAchievementsQuery = () =>
  useQuery<AchievementResponse[], AxiosError>({
    queryKey: ["game", "achievements"],
    queryFn: async () => {
      const response = await client.get("/game/achievements");
      return response.data;
    },
  });

export const useGemBalanceQuery = () =>
  useQuery<GemBalanceResponse, AxiosError>({
    queryKey: ["game", "gems"],
    queryFn: async () => {
      const response = await client.get("/game/gems");
      return response.data;
    },
  });

export const useGemConfigQuery = () =>
  useQuery<GemConfigResponse, AxiosError>({
    queryKey: ["game", "gems", "config"],
    queryFn: async () => {
      const response = await client.get("/game/gems/config");
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });

export const useActiveEventsQuery = () =>
  useQuery<ActiveEvent[], AxiosError>({
    queryKey: ["game", "active-events"],
    queryFn: async () => {
      const response = await client.get("/game/active-events");
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useInventoryQuery = () =>
  useQuery<UserInventoryResponse, AxiosError>({
    queryKey: ["game", "inventory"],
    queryFn: async () => {
      const response = await client.get("/game/inventory");
      return response.data;
    },
    staleTime: 30 * 1000,
  });

export const useSpendGemsMutation = () =>
  useMutation<SpendGemsResponse, AxiosError, SpendGemsRequest>({
    mutationFn: async (payload) => {
      const response = await client.post("/game/gems/spend", payload);
      return response.data;
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["game", "gems"] });
      context.client.invalidateQueries({ queryKey: ["game", "inventory"] });
      context.client.invalidateQueries({ queryKey: ["game", "active-events"] });
      context.client.invalidateQueries({ queryKey: ["game", "leaderboard"] });
      context.client.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

export const useUseSkillMutation = () =>
  useMutation<UseSkillResponse, AxiosError, string>({
    mutationFn: async (itemKey) => {
      const response = await client.post(`/game/inventory/use?item_key=${encodeURIComponent(itemKey)}`);
      return response.data;
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["game", "inventory"] });
      context.client.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

export const useClaimAchievementMutation = () =>
  useMutation<ClaimAchievementResponse, AxiosError, ClaimAchievementRequest>({
    mutationFn: async (payload) => {
      const response = await client.post("/game/achievements/claim", payload);
      return response.data;
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["game", "achievements"] });
      context.client.invalidateQueries({ queryKey: ["game", "gems"] });
    },
  });

export * from "./models";
export * from "./client";
