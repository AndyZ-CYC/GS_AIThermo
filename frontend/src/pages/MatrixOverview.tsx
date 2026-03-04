import { useState, useRef, useEffect, useCallback } from "react";
import { useGameTypes } from "../hooks/useGameTypes";
import { useRoleGroups } from "../hooks/useRoles";
import { useToolCells } from "../hooks/useToolCells";
import type { ToolCell, GameType, RoleGroup } from "../types";
import { getMaturityTier, allTiers } from "../utils/maturity";
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
  const scrollRef = useRef<HTMLDivElement>(null);


  if (gtLoading || rgLoading || tcLoading) {
    return <MatrixSkeleton />;
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

  const totalRoles = roleGroups.reduce((s, g) => s + g.roles.length, 0);

  if (gameTypes.length === 0 && roleGroups.length === 0) {
    return (
      <div className="p-12 text-center text-text-secondary">
        <p className="text-lg mb-2">尚未添加任何数据</p>
        <p className="text-text-muted">请先前往「数据管理」添加游戏类型和工种</p>
      </div>
    );
  }

  const colCount = gameTypes.length + 1;

  return (
    <>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 text-base text-text-secondary">
          <span>{gameTypes.length} 个游戏类型</span>
          <span className="text-text-muted">·</span>
          <span>{totalRoles} 个工种</span>
          <span className="text-text-muted">·</span>
          <span>{toolCells.length} 个已配置工具</span>
        </div>
        <MaturityLegend />
      </div>

      <div
        ref={scrollRef}
        className="matrix-scroll-container overflow-auto pb-2"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `200px repeat(${gameTypes.length}, minmax(140px, 1fr))`,
          }}
        >
          {/* Header row — sticky top */}
          <div className="sticky top-0 left-0 z-30 bg-bg-base" />
          {gameTypes.map((gt) => (
            <div key={gt.id} className="sticky top-0 z-20 bg-bg-base pt-1 pb-1">
              <GameTypeHeader gameType={gt} />
            </div>
          ))}

          {/* Data rows by group */}
          {roleGroups.map((group) => (
            <RoleGroupRows
              key={group.id}
              group={group}
              gameTypes={gameTypes}
              cellMap={cellMap}
              colCount={colCount}
              isCollapsed={!!collapsed[group.id]}
              onToggle={() => toggleGroup(group.id)}
              onCellClick={openView}
              onAddClick={openCreate}
            />
          ))}
        </div>
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

function MaturityLegend() {
  return (
    <div className="flex items-center gap-3 text-sm">
      {allTiers.map((t) => (
        <div key={t.level} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: t.color }}
          />
          <span className="text-text-secondary">
            {t.label}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm border border-dashed border-text-muted bg-bg-surface" />
        <span className="text-text-secondary">缺失</span>
      </div>
    </div>
  );
}

function GameTypeHeader({ gameType }: { gameType: GameType }) {
  const hasPosters = gameType.posters.length > 0;
  const hasExtra = !!(gameType.description || (gameType.examples?.length ?? 0) > 0);

  const [showPopover, setShowPopover] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = useCallback(() => {
    if (!hasExtra) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowPopover(true), 250);
  }, [hasExtra]);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowPopover(false), 150);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      className={`relative flex flex-col items-center gap-2 px-2 py-4 rounded-lg bg-bg-surface/60 transition-all duration-200 ${
        hasPosters ? "justify-between" : "justify-center"
      } ${hasExtra ? "cursor-pointer hover:scale-[1.03] hover:bg-bg-surface" : ""}`}
      style={{
        ...(showPopover ? { zIndex: 35, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" } : {}),
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="text-base font-medium text-text-primary text-center leading-tight">
        {gameType.name}
      </span>
      {hasExtra && (
        <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
      )}
      {hasPosters && (
        <div className="flex justify-center -space-x-2">
          {gameType.posters.slice(0, 3).map((p) => (
            <img
              key={p.id}
              src={p.file_path}
              className="w-12 h-12 rounded-md object-cover border border-border"
              alt=""
            />
          ))}
          {gameType.posters.length > 3 && (
            <span className="w-12 h-12 rounded-md bg-bg-elevated flex items-center justify-center text-xs text-text-muted border border-border">
              +{gameType.posters.length - 3}
            </span>
          )}
        </div>
      )}

      {showPopover && hasExtra && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 w-56 border border-border rounded-lg p-3 space-y-2 animate-fade-in"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.6)", backgroundColor: "#2a2a30" }}
          onMouseEnter={() => { clearTimeout(timerRef.current); }}
          onMouseLeave={handleLeave}
        >
          {gameType.description && (
            <p className="text-xs text-text-secondary leading-relaxed">{gameType.description}</p>
          )}
          {(gameType.examples?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {gameType.examples.map((ex) => (
                <span
                  key={ex}
                  className="inline-block px-2 py-0.5 text-xs rounded-full bg-accent/15 text-accent border border-accent/20"
                >
                  {ex}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleGroupRows({
  group,
  gameTypes,
  cellMap,
  colCount,
  isCollapsed,
  onToggle,
  onCellClick,
  onAddClick,
}: {
  group: RoleGroup;
  gameTypes: GameType[];
  cellMap: Map<string, ToolCell>;
  colCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onCellClick: (cell: ToolCell) => void;
  onAddClick: (gameTypeId: number, roleId: number) => void;
}) {
  return (
    <>
      {/* Group header: spans full width, inner content sticky left */}
      <div
        className="cursor-pointer select-none rounded-md bg-bg-elevated/60 hover:bg-bg-elevated transition-colors"
        style={{ gridColumn: `1 / ${colCount + 1}` }}
        onClick={onToggle}
      >
        <div className="sticky left-0 w-fit px-4 py-2.5 flex items-center gap-2">
          <span className="text-text-muted text-sm">
            {isCollapsed ? "▶" : "▼"}
          </span>
          <span className="text-base font-medium text-text-primary">
            {group.name}
          </span>
          <span className="text-sm text-text-muted ml-1">
            {group.roles.length} 个子工种
          </span>
        </div>
      </div>

      {!isCollapsed &&
        group.roles.map((role) => (
          <RoleRow
            key={role.id}
            roleName={role.name}
            roleId={role.id}
            gameTypes={gameTypes}
            cellMap={cellMap}
            onCellClick={onCellClick}
            onAddClick={onAddClick}
          />
        ))}
    </>
  );
}

function RoleRow({
  roleName,
  roleId,
  gameTypes,
  cellMap,
  onCellClick,
  onAddClick,
}: {
  roleName: string;
  roleId: number;
  gameTypes: GameType[];
  cellMap: Map<string, ToolCell>;
  onCellClick: (cell: ToolCell) => void;
  onAddClick: (gameTypeId: number, roleId: number) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 bg-bg-base flex items-center pl-5 pr-2 rounded-md">
        <span className="text-sm text-text-primary/80 truncate">{roleName}</span>
      </div>
      {gameTypes.map((gt) => {
        const cell = cellMap.get(`${gt.id}-${roleId}`);
        return (
          <CellCard
            key={`${gt.id}-${roleId}`}
            cell={cell}
            onView={() => cell && onCellClick(cell)}
            onAdd={() => onAddClick(gt.id, roleId)}
          />
        );
      })}
    </>
  );
}

function PlaceholderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-text-muted ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

function CellCard({
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
      <div
        className="rounded-[10px] border border-dashed border-text-muted/30 flex items-center justify-center min-h-[56px] cursor-pointer group transition-all duration-200 hover:border-accent/50"
        onClick={onAdd}
      >
        <svg
          className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    );
  }

  if (cell.is_na) {
    return (
      <div
        className="rounded-[10px] min-h-[56px] cursor-pointer transition-all duration-200 hover:opacity-80 relative overflow-hidden flex items-center justify-center gap-1.5 bg-bg-surface/50 border border-border/50"
        onClick={onView}
      >
        <svg
          className="w-4 h-4 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <span className="text-xs text-text-muted">不适用</span>
      </div>
    );
  }

  const tier = getMaturityTier(cell.maturity_score);

  return (
    <div
      className="group/card rounded-[10px] min-h-[56px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        backgroundColor: tier.cardBg,
        boxShadow: "0 2px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)",
      }}
      onClick={onView}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.04), transparent 50%)",
        }}
      />
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
        style={{ backgroundColor: tier.indicatorColor }}
      />
      <div className="relative px-3 py-2.5 pl-4 flex items-center gap-2">
        {cell.icon_path ? (
          <img
            src={cell.icon_path}
            alt=""
            className="w-5 h-5 rounded object-cover shrink-0"
          />
        ) : (
          <PlaceholderIcon className="w-5 h-5 shrink-0" />
        )}
        <span className="text-sm font-medium text-text-primary truncate">
          {cell.tool_name}
        </span>
      </div>
      {cell.official_url && cell.official_url !== "-" && (
        <a
          href={cell.official_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 p-1 rounded-md bg-accent/90 text-white opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 hover:bg-accent"
          title="打开官网"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H21m0 0v7.5m0-7.5L10.5 13.5" />
          </svg>
        </a>
      )}
    </div>
  );
}

function MatrixSkeleton() {
  const shimmer = "animate-pulse bg-bg-surface rounded-[10px]";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className={`${shimmer} h-5 w-28`} />
          <div className={`${shimmer} h-5 w-24`} />
          <div className={`${shimmer} h-5 w-32`} />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${shimmer} h-5 w-14`} />
          ))}
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "200px repeat(5, 1fr)" }}>
        <div className={`${shimmer} h-20`} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${shimmer} h-20`} />
        ))}
        <div className={`${shimmer} h-10`} style={{ gridColumn: "1 / -1" }} />
        {[1, 2, 3].map((row) => (
          <div key={row} className="contents">
            <div className={`${shimmer} h-14`} />
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className={`${shimmer} h-14`} />
            ))}
          </div>
        ))}
        <div className={`${shimmer} h-10`} style={{ gridColumn: "1 / -1" }} />
        {[1, 2].map((row) => (
          <div key={row} className="contents">
            <div className={`${shimmer} h-14`} />
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className={`${shimmer} h-14`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
