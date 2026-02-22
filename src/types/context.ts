import type { Dispatch, SetStateAction } from "react";
import type { ResultType } from "@/schema/location";

export interface LocationContextType {
  location: ResultType;
  setLocation: Dispatch<SetStateAction<ResultType>>;
}
