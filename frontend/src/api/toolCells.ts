import client from "./client";
import type { ToolCell } from "../types";

export const fetchToolCells = () =>
  client.get<ToolCell[]>("/tool-cells").then((r) => r.data);

export const createToolCell = (data: {
  game_type_id: number;
  role_id: number;
  is_na?: boolean;
  tool_name?: string;
  maturity_score?: number;
  official_url?: string;
  short_desc?: string;
  report_url?: string;
}) => client.post<ToolCell>("/tool-cells", data).then((r) => r.data);

export const updateToolCell = (
  id: number,
  data: {
    is_na?: boolean;
    tool_name?: string;
    maturity_score?: number;
    official_url?: string;
    short_desc?: string;
    report_url?: string | null;
  }
) => client.put<ToolCell>(`/tool-cells/${id}`, data).then((r) => r.data);

export const deleteToolCell = (id: number) =>
  client.delete(`/tool-cells/${id}`);

export const uploadIcon = (cellId: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return client
    .post<ToolCell>(`/tool-cells/${cellId}/icon`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteIcon = (cellId: number) =>
  client.delete<ToolCell>(`/tool-cells/${cellId}/icon`).then((r) => r.data);
