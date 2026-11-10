import { useEffect, useSyncExternalStore } from "react";
import type { UserProfile } from "./types";
import { fetchProfileById } from "./service";
const profiles = new Map<string, UserProfile>();
const versions = new Map<string, number>();
export const profileVersion = (id: string) => versions.get(id) ?? 0;
export const cachedProfile = (id: string) => profiles.get(id);
const listeners = new Set<() => void>();
export function publishProfile(profile: UserProfile) {
  profiles.set(profile.id, profile);
  versions.set(profile.id, profileVersion(profile.id) + 1);
  listeners.forEach((listener) => listener());
}
export function useCanonicalProfile(userId?: string) {
  const profile = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => (userId ? (profiles.get(userId) ?? null) : null),
    () => null,
  );
  useEffect(() => {
    if (userId && !profiles.has(userId)) void fetchProfileById(userId);
  }, [userId]);
  return profile;
}
