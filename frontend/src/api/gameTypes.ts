import client from "./client";
import type { GameType } from "../types";

export const fetchGameTypes = () =>
  client.get<GameType[]>("/game-types").then((r) => r.data);

export const createGameType = (data: {
  name: string;
  description?: string;
  examples?: string[];
}) => client.post<GameType>("/game-types", data).then((r) => r.data);

export const updateGameType = (
  id: number,
  data: { name: string; description?: string; examples?: string[] }
) => client.put<GameType>(`/game-types/${id}`, data).then((r) => r.data);

export const deleteGameType = (id: number) =>
  client.delete(`/game-types/${id}`);

export const sortGameTypes = (ids: number[]) =>
  client.put("/game-types/sort", { ids });

export const uploadPosters = (gameTypeId: number, files: FileList) => {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  return client.post(`/game-types/${gameTypeId}/posters`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePoster = (posterId: number) =>
  client.delete(`/posters/${posterId}`);
