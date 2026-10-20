import { createContext, useContext, type ReactNode } from "react";

const ReadOnlyCtx = createContext(false);

/** Wraps the public viewer area: everything inside renders without edit controls. */
export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  return <ReadOnlyCtx.Provider value={true}>{children}</ReadOnlyCtx.Provider>;
}

export const useReadOnly = () => useContext(ReadOnlyCtx);
