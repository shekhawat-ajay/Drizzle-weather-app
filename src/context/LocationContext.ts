import { createContext } from "react";
import type { LocationContextType } from "@/types/context";

export const LocationContext = createContext<LocationContextType | null>(null);
