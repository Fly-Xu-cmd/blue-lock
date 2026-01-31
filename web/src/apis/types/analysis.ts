export interface AnalysisParams {
  /**
   * 分析时间范围，例如：1表示今天, 2表示本周, 3表示本月
   */
  time_period: number;
  /**
   * 分页页码
   */
  page: number;
  /**
   * 分页大小
   */
  page_size: number;
}

export interface AnalysisResponse {
  code: number;
  data: AnalysisData;
  [property: string]: any;
}

interface AnalysisData {
  /**
   * 分析数据列表
   */
  recordList: AnalysisItem[];
  /**
   * 总记录数
   */
  total: number;
  /**
   * 锁定次数
   */
  lock_count: number;
  /**
   * 解锁次数
   */
  unlock_count: number;
}

interface AnalysisItem {
  /**
   * 记录ID
   */
  id: number;
  /**
   * 用户名
   */
  user_name: string;
  /**
   * 操作内容，例如："锁定"或"解锁"
   */
  operation_content: string;
  /**
   * 操作时间
   */
  operate_time: string;
}

export interface addOperationRecordParams {
  /**
   * 操作类型，1表示锁定，2表示解锁
   */
  type: number;
  /**
   * 操作内容，例如："锁定"或"解锁"
   */
  operation_content: string;
}

export interface addOperationRecordResponse {
  code: number;
  data: addOperationRecordData;
  [property: string]: any;
}

interface addOperationRecordData {
  /**
   * 操作记录ID
   */
  id: number;
  /**
   * 用户名
   */
  user_name: string;
  /**
   * 操作类型，1表示锁定，2表示解锁
   */
  type: number;
  /**
   * 操作内容，例如："锁定"或"解锁"
   */
  operation_content: string;
  /**
   * 操作时间
   */
  operate_time: string;
}
