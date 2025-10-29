/**
 * IDH (Individual Data Hub) Types
 * Used for student transportation and address management via PP API
 */

export interface IDHStudent {
  studentNumber: string;
  schoolId: string;
  primaryPhone: string;
  otherPhone: string;
  transportationType: string;
  emirate: string;
  area: string;
  street: string;
  houseBuilding: string;
  region: string;
  zone: string;
  plot: string;
  mainPlot: string;
  premises: string;
  latitude: string;
  longitude: string;
  attachment01: string;
  statusId: number;
  sourceId: string;
  datetime: string;
  ReturnComment?: string;
}

export interface IDHApiResponse {
  ok: boolean;
  data?: IDHStudent;
  error?: string;
  meta?: {
    sourceId: string;
    fetchedAt?: string;
    insertedAt?: string;
  };
}

export interface IDHInsertResponse {
  ok: boolean;
  data?: {
    id?: number;
    sourceId: string;
    message?: string;
  };
  error?: string;
  meta?: {
    sourceId: string;
    insertedAt: string;
  };
}
