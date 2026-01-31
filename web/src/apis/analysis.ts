import { http } from "../utils/http";

import {
  addOperationRecordParams,
  addOperationRecordResponse,
  AnalysisParams,
  AnalysisResponse,
} from "./types/analysis";

const api = {
  addOperationRecord: "/api/user/operationRecord",
  analysis: "/api/user/getOperateRecord",
};

export const addOperationRecord = (data: addOperationRecordParams) => {
  return http.post<addOperationRecordResponse>(api.addOperationRecord, data);
};

export const getAnalysis = (params: AnalysisParams) => {
  return http.get<AnalysisResponse>(api.analysis, { params });
};
