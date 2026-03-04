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
import type { RoleGroup, Role } from "../types";
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

export default function RoleManagement() {
  const { data: roleGroups = [], isLoading } = useRoleGroups();
  const createGroupMut = useCreateRoleGroup();
  const sortGroupMut = useSortRoleGroups();

  const [newGroupName, setNewGroupName] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  if (isLoading) return <div className="p-8 text-gray-500">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 mb-4">工种管理</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="输入新的工种大类名称..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
        />
        <button
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          新增大类
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={roleGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {roleGroups.map((group) => (
              <SortableRoleGroupCard key={group.id} group={group} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {roleGroups.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">暂无工种大类，请添加</p>
      )}
    </div>
  );
}

function SortableRoleGroupCard({ group }: { group: RoleGroup }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const updateMut = useUpdateRoleGroup();
  const deleteMut = useDeleteRoleGroup();
  const createRoleMut = useCreateRole();
  const sortRolesMut = useSortRoles();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [newRoleName, setNewRoleName] = useState("");

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({ id: group.id, name: editName.trim() });
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(group.id);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail;
      alert(detail?.message ?? "删除失败");
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    await createRoleMut.mutateAsync({ roleGroupId: group.id, name: newRoleName.trim() });
    setNewRoleName("");
  };

  const handleRoleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = group.roles.findIndex((r) => r.id === active.id);
    const newIdx = group.roles.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(group.roles, oldIdx, newIdx);
    sortRolesMut.mutate({ roleGroupId: group.id, ids: newOrder.map((r) => r.id) });
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 select-none"
        >
          ⠿
        </span>

        {editing ? (
          <div className="flex-1 flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button onClick={handleSave} className="text-sm text-blue-600">保存</button>
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500">取消</button>
          </div>
        ) : (
          <span className="flex-1 font-semibold text-sm text-gray-800">{group.name}</span>
        )}

        {!editing && (
          <div className="flex gap-1">
            <button onClick={() => { setEditing(true); setEditName(group.name); }} className="text-xs text-blue-600 px-2 py-1">编辑</button>
            <button onClick={handleDelete} className="text-xs text-red-500 px-2 py-1">删除</button>
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRoleDragEnd}>
          <SortableContext items={group.roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {group.roles.map((role) => (
                <SortableRoleRow key={role.id} role={role} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="添加子工种..."
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
          />
          <button
            onClick={handleAddRole}
            disabled={!newRoleName.trim()}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableRoleRow({ role }: { role: Role }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: role.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const updateMut = useUpdateRole();
  const deleteMut = useDeleteRole();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(role.name);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateMut.mutateAsync({ id: role.id, name: editName.trim() });
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(role.id);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail;
      alert(detail?.message ?? "删除失败");
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50">
      <span {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 text-sm select-none">
        ⠿
      </span>

      {editing ? (
        <div className="flex-1 flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
          <button onClick={handleSave} className="text-xs text-blue-600">保存</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500">取消</button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700">{role.name}</span>
          <button onClick={() => { setEditing(true); setEditName(role.name); }} className="text-xs text-blue-600 px-1 opacity-0 group-hover:opacity-100">编辑</button>
          <button onClick={handleDelete} className="text-xs text-red-500 px-1 opacity-0 group-hover:opacity-100">删除</button>
        </>
      )}
    </div>
  );
}
