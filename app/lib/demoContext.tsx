"use client";

import { createContext, useContext, type ReactNode } from "react";

interface DemoState {
  active: boolean;
}

const DemoContext = createContext<DemoState>({ active: false });

export function DemoProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <DemoContext.Provider value={{ active }}>{children}</DemoContext.Provider>
  );
}

export function useDemo(): DemoState {
  return useContext(DemoContext);
}
