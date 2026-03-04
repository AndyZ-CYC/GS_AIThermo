import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Thermometer,
  AlertCircle,
  Loader2,
  Plus,
  Flame,
  Snowflake,
} from 'lucide-react';
import { matrixApi } from '../api/matrix';
import type { MatrixData, ToolCell, MaturityConfig } from '../types';
import styles from './MatrixOverview.module.css';

// 成熟度颜色映射
const MATURITY_COLORS: Record<number, { bg: string; glow: string; text: string }> = {
  1: { bg: '#ff2d2d', glow: 'rgba(255, 45, 45, 0.4)', text: '#ffffff' },
  2: { bg: '#ff6b35', glow: 'rgba(255, 107, 53, 0.4)', text: '#ffffff' },
  3: { bg: '#ffc72c', glow: 'rgba(255, 199, 44, 0.4)', text: '#1a1a1f' },
  4: { bg: '#a8e063', glow: 'rgba(168, 224, 99, 0.4)', text: '#1a1a1f' },
  5: { bg: '#32cd32', glow: 'rgba(50, 205, 50, 0.4)', text: '#ffffff' },
};

const EMPTY_CELL = {
  bg: '#2a2a2e',
  glow: 'rgba(42, 42, 46, 0.2)',
  text: '#5a5a6e',
};

// 获取成熟度颜色
const getMaturityColor = (level: number | null) => {
  if (level === null || level === undefined) return EMPTY_CELL;
  return MATURITY_COLORS[level] || EMPTY_CELL;
};

// 游戏类型卡片组件
interface GameTypeCardProps {
  id: number;
  name: string;
  posters: Array<{ id: number; file_path: string; sort_order: number }>;
  index: number;
}

function GameTypeCard({ name, posters, index }: GameTypeCardProps) {
  return (
    <div
      className={styles.gameTypeCard}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={styles.posterStack}>
        {posters.length > 0 ? (
          posters.slice(0, 3).map((poster, i) => (
            <div
              key={poster.id}
              className={styles.posterImage}
              style={{
                transform: `translateX(${i * 8}px) scale(${1 - i * 0.05})`,
                zIndex: 3 - i,
                opacity: 1 - i * 0.15,
              }}
            >
              <img
                src={`http://localhost:3001${poster.file_path}`}
                alt=""
                loading="lazy"
              />
            </div>
          ))
        ) : (
          <div className={styles.posterPlaceholder}>
            <Flame size={20} />
          </div>
        )}
      </div>
      <div className={styles.gameTypeName}>
        <span>{name}</span>
      </div>
    </div>
  );
}

// 工种行组件
interface RoleRowProps {
  roleId: number;
  roleName: string;
  depth: number;
  gameTypeIds: number[];
  toolCellsMap: Map<string, ToolCell>;
  onCellClick: (toolCell: ToolCell | null, gameTypeId: number, roleId: number) => void;
}

function RoleRow({
  roleId,
  roleName,
  depth,
  gameTypeIds,
  toolCellsMap,
  onCellClick,
}: RoleRowProps) {
  return (
    <div className={styles.roleRow}>
      <div
        className={styles.roleLabel}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <span className={styles.roleIndicator}>◆</span>
        {roleName}
      </div>
      {gameTypeIds.map((gameTypeId) => {
        const cell = toolCellsMap.get(`${gameTypeId}-${roleId}`);
        const colors = getMaturityColor(cell?.maturity_level ?? null);

        return (
          <div
            key={gameTypeId}
            className={styles.cell}
            style={{
              backgroundColor: colors.bg,
              boxShadow: `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
              color: colors.text,
            }}
            onClick={() => onCellClick(cell ?? null, gameTypeId, roleId)}
          >
            {cell ? (
              <div className={styles.cellContent}>
                <span className={styles.toolName}>{cell.tool_name}</span>
                <div className={styles.maturityBadge}>
                  <span>L{cell.maturity_level}</span>
                </div>
              </div>
            ) : (
              <div className={styles.emptyCell}>
                <Plus size={14} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 工种大类组件
interface RoleGroupProps {
  group: {
    id: number;
    name: string;
    roles: Array<{ id: number; name: string; sort_order: number }>;
  };
  gameTypeIds: number[];
  toolCellsMap: Map<string, ToolCell>;
  onCellClick: (toolCell: ToolCell | null, gameTypeId: number, roleId: number) => void;
}

function RoleGroup({
  group,
  gameTypeIds,
  toolCellsMap,
  onCellClick,
}: RoleGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.roleGroup}>
      <div
        className={styles.roleGroupHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.expandIcon}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className={styles.roleGroupName}>{group.name}</span>
        <span className={styles.roleCount}>{group.roles.length} 项</span>
      </div>

      {isExpanded && (
        <div className={styles.roleList}>
          {group.roles.map((role) => (
            <RoleRow
              key={role.id}
              roleId={role.id}
              roleName={role.name}
              depth={1}
              gameTypeIds={gameTypeIds}
              toolCellsMap={toolCellsMap}
              onCellClick={onCellClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 成熟度图例组件
function MaturityLegend({ config }: { config: MaturityConfig[] }) {
  const sortedConfig = [...config].sort((a, b) => a.level - b.level);

  return (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>
        <Thermometer size={16} />
        <span>成熟度等级</span>
      </div>
      <div className={styles.legendItems}>
        {sortedConfig.map((item) => {
          const colors = getMaturityColor(item.level);
          return (
            <div key={item.level} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{
                  backgroundColor: colors.bg,
                  boxShadow: `0 0 8px ${colors.glow}`,
                }}
              />
              <span className={styles.legendLabel}>
                L{item.level}: {item.label}
              </span>
            </div>
          );
        })}
        <div className={styles.legendItem}>
          <div
            className={styles.legendColor}
            style={{ backgroundColor: EMPTY_CELL.bg }}
          />
          <span className={styles.legendLabel}>待添加</span>
        </div>
      </div>
    </div>
  );
}

// 主组件
export function MatrixOverview() {
  const [_selectedCell, setSelectedCell] = useState<{
    toolCell: ToolCell | null;
    gameTypeId: number;
    roleId: number;
  } | null>(null);

  const {
    data: matrixData,
    isLoading,
    error,
  } = useQuery<MatrixData>({
    queryKey: ['matrix'],
    queryFn: matrixApi.getMatrixData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 构建工具卡片快速查找映射
  const toolCellsMap = useMemo(() => {
    const map = new Map<string, ToolCell>();
    if (matrixData?.toolCells) {
      matrixData.toolCells.forEach((cell) => {
        map.set(`${cell.game_type_id}-${cell.role_id}`, cell);
      });
    }
    return map;
  }, [matrixData?.toolCells]);

  // 获取所有游戏类型ID
  const gameTypeIds = useMemo(() => {
    return matrixData?.gameTypes.map((gt) => gt.id) ?? [];
  }, [matrixData?.gameTypes]);

  const handleCellClick = (toolCell: ToolCell | null, gameTypeId: number, roleId: number) => {
    setSelectedCell({ toolCell, gameTypeId, roleId });
    // TODO: 打开工具详情弹窗
    console.log('Cell clicked:', { toolCell, gameTypeId, roleId });
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <Loader2 className={styles.loadingSpinner} size={48} />
          <span>正在加载矩阵数据...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <AlertCircle size={48} />
          <span>加载失败，请刷新重试</span>
          <span className={styles.errorDetail}>{String(error)}</span>
        </div>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <Snowflake size={48} />
          <span>暂无数据</span>
        </div>
      </div>
    );
  }

  const { gameTypes, roleGroups, maturityConfig } = matrixData;

  return (
    <div className={styles.container}>
      <div className="thermal-bg" />
      <div className="scanlines" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Thermometer className={styles.logo} size={28} />
          <div>
            <h1 className={styles.title}>AI 行业温度计</h1>
            <p className={styles.subtitle}>AI Tools Maturity Matrix</p>
          </div>
        </div>
        <MaturityLegend config={maturityConfig} />
      </header>

      {/* Matrix Grid */}
      <div className={styles.matrixWrapper}>
        {/* 横轴 - 游戏类型 */}
        <div className={styles.horizontalAxis}>
          <div className={styles.cornerCell}>
            <span>矩阵视图</span>
          </div>
          <div className={styles.gameTypesScroll}>
            {gameTypes.length > 0 ? (
              gameTypes.map((gameType, index) => (
                <GameTypeCard
                  key={gameType.id}
                  id={gameType.id}
                  name={gameType.name}
                  posters={gameType.posters}
                  index={index}
                />
              ))
            ) : (
              <div className={styles.emptyAxis}>
                <span>尚未添加游戏类型</span>
              </div>
            )}
          </div>
        </div>

        {/* 主体区域 */}
        <div className={styles.matrixBody}>
          {/* 纵轴 - 工种列表 */}
          <div className={styles.verticalAxis}>
            {roleGroups.length > 0 ? (
              roleGroups.map((group) => (
                <RoleGroup
                  key={group.id}
                  group={group}
                  gameTypeIds={gameTypeIds}
                  toolCellsMap={toolCellsMap}
                  onCellClick={handleCellClick}
                />
              ))
            ) : (
              <div className={styles.emptyAxis}>
                <span>尚未添加工种</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <footer className={styles.footer}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{gameTypes.length}</span>
          <span className={styles.statLabel}>游戏类型</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {roleGroups.reduce((acc, g) => acc + g.roles.length, 0)}
          </span>
          <span className={styles.statLabel}>工种子类</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{matrixData.toolCells.length}</span>
          <span className={styles.statLabel}>工具卡片</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {gameTypeIds.length *
              roleGroups.reduce((acc, g) => acc + g.roles.length, 0) -
              matrixData.toolCells.length}
          </span>
          <span className={styles.statLabel}>待添加</span>
        </div>
      </footer>
    </div>
  );
}

export default MatrixOverview;
