import axios from "axios";

export const fetcher = async (URL: string) => {
  const response = await axios.get(URL);
  const data = response.data;
  return data;
};
