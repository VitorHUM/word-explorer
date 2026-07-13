"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/constants";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";
import { getSessionProfile, logout, signIn, signUp } from "@/services/auth.service";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSessionProfile,
    retry: false,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignInInput) => signIn(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignUpInput) => signUp(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.clear();
    },
  });
}
