import { useState, useRef } from "react";
import {
  useGameTypes,
  useCreateGameType,
  useUpdateGameType,
  useDeleteGameType,
  useSortGameTypes,
  useUploadPosters,
  useDeletePoster,
} from "../hooks/useGameTypes";
import type { GameType } from "../types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const inputCls =
  "bg-bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:ring-2 focus:ring-accent/40 focus:border-accent/60 outline-none transition-colors";

export default function GameTypeManagement() {
  const { data: gameTypes = [], isLoading } = useGameTypes();
  const createMut = useCreateGameType();
  const sortMut = useSortGameTypes();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMut.mutateAsync(newName.trim());
    setNewName("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = gameTypes.findIndex((g) => g.id === active.id);
    const newIdx = gameTypes.findIndex((g) => g.id === over.id);
    const newOrder = arrayMove(gameTypes, oldIdx, newIdx);
    sortMut.mutate(newOrder.map((g) => g.id));
  };

  if (isLoading) {
    return <div className="p-8 text-text-secondary">加载中...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-text-primary mb-4">游戏类型管理</h1>

      <div className="flex gap-2 mb-6">
        <input
          className={`flex-1 ${inputCls}`}
          placeholder="输入新的游戏类型名称..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="px-4 py-1.5 bg-accent text-white text-sm rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          新增
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={gameTypes.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {gameTypes.map((gt) => (
              <SortableGameTypeCard
                key={gt.id}
                gameType={gt}
                isEditing={editingId === gt.id}
                onEdit={() => setEditingId(gt.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {gameTypes.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">
          暂无游戏类型，请添加
        </p>
      )}
    </div>
  );
}

function SortableGameTypeCard({
  gameType,
  isEditing,
  onEdit,
  onCancelEdit,
}: {
  gameType: GameType;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: gameType.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateMut = useUpdateGameType();
  const deleteMut = useDeleteGameType();
  const uploadMut = useUploadPosters();
  const deletePosterMut = useDeletePoster();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState(gameType.name);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({ id: gameType.id, name: editName.trim() });
    onCancelEdit();
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(gameType.id);
    } catch (err: unknown) {
      const detail = (
        err as {
          response?: { data?: { detail?: { message?: string } } };
        }
      )?.response?.data?.detail;
      alert(detail?.message ?? "删除失败");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadMut.mutateAsync({
        gameTypeId: gameType.id,
        files: e.target.files,
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-bg-surface border border-border rounded-lg p-3"
    >
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-muted hover:text-text-secondary select-none"
        >
          ⠿
        </span>

        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <input
              className={`flex-1 ${inputCls}`}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              保存
            </button>
            <button
              onClick={onCancelEdit}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-text-primary">
            {gameType.name}
          </span>
        )}

        {!isEditing && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="text-xs text-accent hover:text-accent-hover px-2 py-1 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 transition-colors"
            >
              上传海报
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
            >
              删除
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {gameType.posters.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {gameType.posters.map((p) => (
            <div key={p.id} className="relative group">
              <img
                src={p.file_path}
                className="w-16 h-16 object-cover rounded border border-border"
                alt=""
              />
              <button
                onClick={() => deletePosterMut.mutate(p.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
