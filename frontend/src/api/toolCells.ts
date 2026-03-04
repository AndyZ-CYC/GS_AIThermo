import client from "./client";
import type { ToolCell } from "../types";

export const fetchToolCells = () =>
  client.get<ToolCell[]>("/tool-cells").then((r) => r.data);

export const createToolCell = (data: {
  game_type_id: number;
  role_id: number;
  tool_name: string;
  maturity_score: number;
  official_url: string;
  short_desc: string;
  report_url?: string;
}) => client.post<ToolCell>("/tool-cells", data).then((r) => r.data);

export const updateToolCell = (
  id: number,
  data: {
    tool_name: string;
    maturity_score: number;
    official_url: string;
    short_desc: string;
    report_url?: string | null;
  }
) => client.put<ToolCell>(`/tool-cells/${id}`, data).then((r) => r.data);

export const deleteToolCell = (id: number) =>
  client.delete(`/tool-cells/${id}`);
