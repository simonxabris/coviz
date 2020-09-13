import type { ReportType } from "../enums";
import type { CountryData } from "./country-data.type";

export type FetchedData = Record<ReportType, CountryData[]>;
