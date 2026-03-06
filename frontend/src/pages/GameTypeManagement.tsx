import { useState, useRef, type KeyboardEvent } from "react";
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
import ConfirmModal from "../components/ConfirmModal";
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
  "bg-bg-surface border border-border rounded-md px-3 py-2 text-base text-text-primary focus:ring-2 focus:ring-accent/40 focus:border-accent/60 outline-none transition-colors";

export default function GameTypeManagement() {
  const { data: gameTypes = [], isLoading } = useGameTypes();
  const createMut = useCreateGameType();
  const sortMut = useSortGameTypes();

  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMut.mutateAsync({ name: newName.trim() });
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
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">游戏类型管理</h2>

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
          className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
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
                isExpanded={expandedId === gt.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === gt.id ? null : gt.id))
                }
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
  isExpanded,
  onToggleExpand,
}: {
  gameType: GameType;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
  const [editDesc, setEditDesc] = useState(gameType.description ?? "");
  const [editExamples, setEditExamples] = useState<string[]>(
    gameType.examples ?? []
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resetForm = () => {
    setEditName(gameType.name);
    setEditDesc(gameType.description ?? "");
    setEditExamples(gameType.examples ?? []);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({
      id: gameType.id,
      name: editName.trim(),
      description: editDesc.trim(),
      examples: editExamples,
    });
    onToggleExpand();
  };

  const handleCancel = () => {
    resetForm();
    onToggleExpand();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMut.mutateAsync(gameType.id);
      setShowDeleteConfirm(false);
    } catch (err: unknown) {
      const detail = (
        err as {
          response?: { data?: { detail?: { message?: string } } };
        }
      )?.response?.data?.detail;
      alert(detail?.message ?? "删除失败");
      setShowDeleteConfirm(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentCount = gameType.posters.length;
      const availableSlots = 6 - currentCount;

      if (availableSlots <= 0) {
        alert("每个游戏类型最多只能上传 6 张海报");
        return;
      }

      let filesToUpload = e.target.files;
      if (filesToUpload.length > availableSlots) {
        alert(`数量超出限制，已自动为您保留前 ${availableSlots} 张海报`);
        const dt = new DataTransfer();
        for (let i = 0; i < availableSlots; i++) {
          dt.items.add(filesToUpload[i]);
        }
        filesToUpload = dt.files;
      }

      await uploadMut.mutateAsync({
        gameTypeId: gameType.id,
        files: filesToUpload,
      });
    }
  };

  const hasExtraInfo = !!(gameType.description || (gameType.examples?.length ?? 0) > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-bg-surface border border-border rounded-lg overflow-hidden"
    >
      {/* Collapsed header row */}
      <div className="flex items-center gap-2 p-3">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-muted hover:text-text-secondary select-none"
        >
          ⠿
        </span>

        <button
          onClick={onToggleExpand}
          className="text-text-muted hover:text-text-secondary transition-transform duration-200 text-sm"
          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </button>

        <span className="flex-1 text-base font-medium text-text-primary">
          {gameType.name}
        </span>

        {hasExtraInfo && !isExpanded && (
          <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-elevated">
            {gameType.examples?.length ?? 0} 个示例
          </span>
        )}

        {!isExpanded && (
          <div className="flex gap-1">
            <button
              onClick={onToggleExpand}
              className="text-sm text-accent hover:text-accent-hover px-2 py-1 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
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

      {/* Expanded panel */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? "600px" : "0",
          opacity: isExpanded ? 1 : 0,
          overflow: "hidden",
        }}
      >
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
          <label className="block">
            <span className="text-xs text-text-muted">名称</span>
            <input
              className={`mt-0.5 w-full ${inputCls}`}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-xs text-text-muted">类别描述</span>
            <textarea
              className={`mt-0.5 w-full ${inputCls} resize-none`}
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="对该游戏类型的描述..."
            />
          </label>

          <div>
            <span className="text-xs text-text-muted">游戏示例</span>
            <TagInput
              tags={editExamples}
              onChange={setEditExamples}
              placeholder="输入后按 Enter 添加..."
            />
          </div>

          {/* Posters section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">海报 ({gameType.posters.length}/6)</span>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={gameType.posters.length >= 6}
                className="text-xs text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={gameType.posters.length >= 6 ? "海报数量已达上限" : ""}
              >
                上传海报
              </button>
            </div>
            {gameType.posters.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {gameType.posters.map((p) => (
                  <div key={p.id} className="relative group w-20">
                    <img
                      src={p.file_path}
                      className="w-full aspect-[3/4] object-cover rounded border border-border"
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
            ) : (
              <p className="text-xs text-text-muted">暂无海报</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-1">
            <button
              onClick={handleDelete}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              删除
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="px-4 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="删除游戏类型"
          message={`确定要删除游戏类型「${gameType.name}」及其所有相关数据吗？此操作无法撤销。`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 bg-bg-surface border border-border rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent/60 transition-colors min-h-[38px]">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-accent/[.13] text-text-secondary border border-accent/20 shadow-sm"
        >
          {tag}
          <button
            onClick={() => removeTag(i)}
            className="hover:text-red-400 transition-colors leading-none text-base text-text-muted hover:text-red-400"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[80px] bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
