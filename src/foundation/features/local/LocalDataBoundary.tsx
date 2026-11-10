import { useLayoutEffect, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { scopeForUser, selectScope, useLocalScope } from "./persistence";

export function LocalDataBoundary({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const selected = useLocalScope();
  const desired =
    state.status === "initializing"
      ? "locked"
      : scopeForUser(
          state.status === "authenticated" ||
            state.status === "operational-error"
            ? state.user?.id
            : undefined,
        );
  useLayoutEffect(() => {
    selectScope(desired);
  }, [desired]);
  if (desired === "locked" || desired !== selected)
    return <div role="status">A preparar os dados locais da sessão…</div>;
  return (
    <div key={desired} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
