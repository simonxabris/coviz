export type CountryData = {
  "Province/State": string;
  "Country/Region": string;
  Lat: number;
  Long: number;
} & { [date: string]: number };
