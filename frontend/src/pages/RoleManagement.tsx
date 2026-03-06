import { useState } from "react";
import {
  useRoleGroups,
  useCreateRoleGroup,
  useUpdateRoleGroup,
  useDeleteRoleGroup,
  useSortRoleGroups,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useSortRoles,
} from "../hooks/useRoles";
import { useToolCells } from "../hooks/useToolCells";
import type { RoleGroup, Role } from "../types";
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

export default function RoleManagement() {
  const { data: roleGroups = [], isLoading } = useRoleGroups();
  const createGroupMut = useCreateRoleGroup();
  const sortGroupMut = useSortRoleGroups();

  const [newGroupName, setNewGroupName] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await createGroupMut.mutateAsync(newGroupName.trim());
    setNewGroupName("");
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = roleGroups.findIndex((g) => g.id === active.id);
    const newIdx = roleGroups.findIndex((g) => g.id === over.id);
    const newOrder = arrayMove(roleGroups, oldIdx, newIdx);
    sortGroupMut.mutate(newOrder.map((g) => g.id));
  };

  if (isLoading) {
    return <div className="p-8 text-text-secondary">加载中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">工种管理</h2>

      <div className="flex gap-2 mb-6">
        <input
          className={`flex-1 ${inputCls}`}
          placeholder="输入新的工种大类名称..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
        />
        <button
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim()}
          className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          新增大类
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleGroupDragEnd}
      >
        <SortableContext
          items={roleGroups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {roleGroups.map((group) => (
              <SortableRoleGroupCard key={group.id} group={group} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {roleGroups.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">
          暂无工种大类，请添加
        </p>
      )}
    </div>
  );
}

function SortableRoleGroupCard({ group }: { group: RoleGroup }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: group.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateMut = useUpdateRoleGroup();
  const deleteMut = useDeleteRoleGroup();
  const createRoleMut = useCreateRole();
  const sortRolesMut = useSortRoles();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [newRoleName, setNewRoleName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({ id: group.id, name: editName.trim() });
    setEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMut.mutateAsync(group.id);
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

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    await createRoleMut.mutateAsync({
      roleGroupId: group.id,
      name: newRoleName.trim(),
    });
    setNewRoleName("");
  };

  const handleRoleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = group.roles.findIndex((r) => r.id === active.id);
    const newIdx = group.roles.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(group.roles, oldIdx, newIdx);
    sortRolesMut.mutate({
      roleGroupId: group.id,
      ids: newOrder.map((r) => r.id),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-bg-surface border border-border rounded-lg"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-muted hover:text-text-secondary select-none"
        >
          ⠿
        </span>

        {editing ? (
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
              onClick={() => setEditing(false)}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <span className="flex-1 font-semibold text-base text-text-primary">
            {group.name}
          </span>
        )}

        {!editing && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditing(true);
                setEditName(group.name);
              }}
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
      </div>

      <div className="px-3 py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRoleDragEnd}
        >
          <SortableContext
            items={group.roles.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {group.roles.map((role) => (
                <SortableRoleRow key={role.id} role={role} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 mt-2">
          <input
            className={`flex-1 ${inputCls}`}
            placeholder="添加子工种..."
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
          />
          <button
            onClick={handleAddRole}
            disabled={!newRoleName.trim()}
            className="text-sm text-accent hover:text-accent-hover disabled:opacity-40 transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="删除工种大类"
          message={`确定要删除工种大类「${group.name}」及其下的所有子工种和数据吗？此操作无法撤销。`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function SortableRoleRow({ role }: { role: Role }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: role.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateMut = useUpdateRole();
  const deleteMut = useDeleteRole();
  const { data: allCells = [] } = useToolCells();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(role.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isRoleEmpty = !allCells.some((c) => c.role_id === role.id);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({ id: role.id, name: editName.trim() });
    setEditing(false);
  };

  const handleDelete = () => {
    if (isRoleEmpty) {
      confirmDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteMut.mutateAsync(role.id);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-bg-elevated/50 transition-colors"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-muted/50 hover:text-text-muted text-sm select-none"
      >
        ⠿
      </span>

      {editing ? (
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
            onClick={() => setEditing(false)}
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            取消
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-base text-text-secondary">
            {role.name}
          </span>
          <button
            onClick={() => {
              setEditing(true);
              setEditName(role.name);
            }}
            className="text-sm text-accent px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            删除
          </button>
        </>
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="删除子工种"
          message={`确定要删除工种「${role.name}」及其所有相关数据吗？此操作无法撤销。`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
