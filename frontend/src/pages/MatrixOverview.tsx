import { useState } from "react";
import { useGameTypes } from "../hooks/useGameTypes";
import { useRoleGroups } from "../hooks/useRoles";
import { useToolCells } from "../hooks/useToolCells";
import type { ToolCell, GameType, RoleGroup } from "../types";
import { getMaturityTier } from "../utils/maturity";
import ToolCellModal from "../components/ToolCellModal";

export default function MatrixOverview() {
  const { data: gameTypes = [], isLoading: gtLoading } = useGameTypes();
  const { data: roleGroups = [], isLoading: rgLoading } = useRoleGroups();
  const { data: toolCells = [], isLoading: tcLoading } = useToolCells();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "view" | "create" | "edit";
    gameTypeId?: number;
    roleId?: number;
    cell?: ToolCell;
  }>({ open: false, mode: "view" });

  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  if (gtLoading || rgLoading || tcLoading) {
    return <div className="p-8 text-gray-500">加载中...</div>;
  }

  const cellMap = new Map<string, ToolCell>();
  for (const tc of toolCells) {
    cellMap.set(`${tc.game_type_id}-${tc.role_id}`, tc);
  }

  const toggleGroup = (groupId: number) =>
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const openCreate = (gameTypeId: number, roleId: number) =>
    setModalState({ open: true, mode: "create", gameTypeId, roleId });

  const openView = (cell: ToolCell) =>
    setModalState({ open: true, mode: "view", cell });

  if (gameTypes.length === 0 && roleGroups.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg mb-2">尚未添加任何数据</p>
        <p>请先前往「游戏类型管理」和「工种管理」添加数据</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
        <table className="border-collapse min-w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-100 border border-gray-300 px-3 py-2 min-w-[180px] text-left text-sm font-semibold text-gray-700">
                工种 \ 游戏类型
              </th>
              {gameTypes.map((gt) => (
                <GameTypeHeader key={gt.id} gameType={gt} />
              ))}
            </tr>
          </thead>
          <tbody>
            {roleGroups.map((group) => (
              <RoleGroupRows
                key={group.id}
                group={group}
                gameTypes={gameTypes}
                cellMap={cellMap}
                isCollapsed={!!collapsed[group.id]}
                onToggle={() => toggleGroup(group.id)}
                onCellClick={openView}
                onAddClick={openCreate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {modalState.open && (
        <ToolCellModal
          mode={modalState.mode}
          gameTypeId={modalState.gameTypeId}
          roleId={modalState.roleId}
          cell={modalState.cell}
          gameTypes={gameTypes}
          roleGroups={roleGroups}
          onClose={() => setModalState({ open: false, mode: "view" })}
          onSwitchEdit={() =>
            setModalState((s) => ({ ...s, mode: "edit" }))
          }
        />
      )}
    </>
  );
}

function GameTypeHeader({ gameType }: { gameType: GameType }) {
  return (
    <th className="border border-gray-300 px-2 py-2 min-w-[120px] bg-gray-50">
      <div className="text-sm font-semibold text-gray-800 text-center">{gameType.name}</div>
      {gameType.posters.length > 0 && (
        <div className="flex justify-center mt-1 -space-x-2">
          {gameType.posters.slice(0, 4).map((p) => (
            <img
              key={p.id}
              src={p.file_path}
              className="w-8 h-8 rounded object-cover border-2 border-white shadow-sm"
              alt=""
            />
          ))}
          {gameType.posters.length > 4 && (
            <span className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600 border-2 border-white">
              +{gameType.posters.length - 4}
            </span>
          )}
        </div>
      )}
    </th>
  );
}

function RoleGroupRows({
  group,
  gameTypes,
  cellMap,
  isCollapsed,
  onToggle,
  onCellClick,
  onAddClick,
}: {
  group: RoleGroup;
  gameTypes: GameType[];
  cellMap: Map<string, ToolCell>;
  isCollapsed: boolean;
  onToggle: () => void;
  onCellClick: (cell: ToolCell) => void;
  onAddClick: (gameTypeId: number, roleId: number) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={gameTypes.length + 1}
          className="sticky left-0 z-10 bg-gray-200 border border-gray-300 px-3 py-1.5 cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={onToggle}
        >
          <span className="text-sm font-semibold text-gray-700">
            {isCollapsed ? "▶" : "▼"} {group.name}
          </span>
          <span className="text-xs text-gray-500 ml-2">({group.roles.length} 个子工种)</span>
        </td>
      </tr>
      {!isCollapsed &&
        group.roles.map((role) => (
          <tr key={role.id} className="hover:bg-gray-50">
            <td className="sticky left-0 z-10 bg-white border border-gray-300 px-3 py-1.5 text-sm text-gray-700 pl-6">
              {role.name}
            </td>
            {gameTypes.map((gt) => {
              const cell = cellMap.get(`${gt.id}-${role.id}`);
              return (
                <CellRenderer
                  key={`${gt.id}-${role.id}`}
                  cell={cell}
                  onView={() => cell && onCellClick(cell)}
                  onAdd={() => onAddClick(gt.id, role.id)}
                />
              );
            })}
          </tr>
        ))}
    </>
  );
}

function CellRenderer({
  cell,
  onView,
  onAdd,
}: {
  cell?: ToolCell;
  onView: () => void;
  onAdd: () => void;
}) {
  if (!cell) {
    return (
      <td
        className="border border-gray-300 bg-gray-100 text-center cursor-pointer hover:bg-gray-200 transition-colors group"
        onClick={onAdd}
      >
        <span className="text-gray-400 text-xs group-hover:text-blue-500">+ 添加</span>
      </td>
    );
  }

  const tier = getMaturityTier(cell.maturity_score);
  return (
    <td
      className="border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: tier.color + "22" }}
      onClick={onView}
    >
      <div className="px-2 py-1.5 text-center">
        <div
          className="inline-block w-3 h-3 rounded-full mr-1"
          style={{ backgroundColor: tier.color }}
        />
        <span className="text-xs font-medium text-gray-800">{cell.tool_name}</span>
      </div>
    </td>
  );
}
