export interface SkyStar {
  id: string;
  ra: number;
  dec: number;
  mag: number;
  name: string;
}

export interface SkyDso {
  id: string;
  ra: number;
  dec: number;
  mag: number | null;
  type: string;
  desig: string;
  name: string;
}

export interface SkyConstellation {
  id: string;
  ra: number;
  dec: number;
  label_ra: number;
  label_dec: number;
  strokes: number[][][];
}
