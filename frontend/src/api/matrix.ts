import { apiClient } from './client';
import { MatrixData, ApiResponse } from '../types';

export const matrixApi = {
  // 获取矩阵数据
  getMatrixData: async (): Promise<MatrixData> => {
    const response = await apiClient.get<ApiResponse<MatrixData>>('/matrix');
    return response.data.data;
  },
};
