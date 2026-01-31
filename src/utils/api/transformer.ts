import camelcaseKeys from "camelcase-keys";

export const toCamelCase = (obj: any): any => {
  return camelcaseKeys(obj, { deep: true });
};
