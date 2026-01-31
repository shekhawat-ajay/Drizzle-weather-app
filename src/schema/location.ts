import { z } from "zod";

export const ResultSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    elevation: z.number().optional(),
    featureCode: z.string().optional(),
    countryCode: z.string().optional(),
    admin1Id: z.number().optional(),
    admin2Id: z.number().optional(),
    admin3Id: z.number().optional(),
    admin4Id: z.number().optional(),
    timezone: z.string().optional(),
    population: z.number().optional(),
    countryId: z.number().optional(),
    country: z.string().optional(),
    admin1: z.string().optional(),
    admin2: z.string().optional(),
    admin3: z.string().optional(),
    admin4: z.string().optional(),
    postcodes: z.array(z.string()).optional(),
  })
  .readonly();

export type ResultType = z.infer<typeof ResultSchema>;

export const LocationSchema = z
  .object({
    results: z.array(ResultSchema),
    generationtimeMs: z.number(),
  })
  .readonly();

export type LocationType = z.infer<typeof LocationSchema>;
