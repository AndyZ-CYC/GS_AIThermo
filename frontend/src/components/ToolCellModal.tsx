import { useState, useEffect } from "react";
import type { ToolCell, GameType, RoleGroup } from "../types";
import { getMaturityTier } from "../utils/maturity";
import { useCreateToolCell, useUpdateToolCell, useDeleteToolCell } from "../hooks/useToolCells";

interface Props {
  mode: "view" | "create" | "edit";
  gameTypeId?: number;
  roleId?: number;
  cell?: ToolCell;
  gameTypes: GameType[];
  roleGroups: RoleGroup[];
  onClose: () => void;
  onSwitchEdit: () => void;
}

export default function ToolCellModal({
  mode,
  gameTypeId,
  roleId,
  cell,
  gameTypes,
  roleGroups,
  onClose,
  onSwitchEdit,
}: Props) {
  const createMutation = useCreateToolCell();
  const updateMutation = useUpdateToolCell();
  const deleteMutation = useDeleteToolCell();

  const [form, setForm] = useState({
    tool_name: cell?.tool_name ?? "",
    maturity_score: cell?.maturity_score ?? 50,
    official_url: cell?.official_url ?? "",
    short_desc: cell?.short_desc ?? "",
    report_url: cell?.report_url ?? "",
  });

  useEffect(() => {
    if (cell && mode === "edit") {
      setForm({
        tool_name: cell.tool_name,
        maturity_score: cell.maturity_score,
        official_url: cell.official_url,
        short_desc: cell.short_desc,
        report_url: cell.report_url ?? "",
      });
    }
  }, [cell, mode]);

  const effectiveGtId = cell?.game_type_id ?? gameTypeId;
  const effectiveRoleId = cell?.role_id ?? roleId;
  const gtName = gameTypes.find((g) => g.id === effectiveGtId)?.name ?? "";
  const allRoles = roleGroups.flatMap((rg) => rg.roles);
  const roleName = allRoles.find((r) => r.id === effectiveRoleId)?.name ?? "";

  const tier = getMaturityTier(form.maturity_score);

  const handleSubmit = async () => {
    const data = {
      ...form,
      report_url: form.report_url || undefined,
    };
    if (mode === "create" && effectiveGtId && effectiveRoleId) {
      await createMutation.mutateAsync({
        game_type_id: effectiveGtId,
        role_id: effectiveRoleId,
        ...data,
      });
    } else if (mode === "edit" && cell) {
      await updateMutation.mutateAsync({ id: cell.id, ...data });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (cell && confirm("确定要删除这个工具卡片吗？")) {
      await deleteMutation.mutateAsync(cell.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === "create" ? "添加工具卡片" : mode === "edit" ? "编辑工具卡片" : "工具详情"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex gap-4 text-sm text-gray-500">
            <span>游戏类型：<strong className="text-gray-700">{gtName}</strong></span>
            <span>工种：<strong className="text-gray-700">{roleName}</strong></span>
          </div>

          {mode === "view" && cell ? (
            <ViewContent cell={cell} tier={tier} />
          ) : (
            <EditForm form={form} setForm={setForm} tier={tier} />
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-between">
          {mode === "view" ? (
            <>
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700"
              >
                删除
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                  关闭
                </button>
                <button onClick={onSwitchEdit} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  编辑
                </button>
              </div>
            </>
          ) : (
            <>
              <div />
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.tool_name || !form.official_url || !form.short_desc}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewContent({ cell, tier }: { cell: ToolCell; tier: ReturnType<typeof getMaturityTier> }) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-gray-500">工具名称</span>
        <p className="font-semibold text-gray-800">{cell.tool_name}</p>
      </div>
      <div>
        <span className="text-xs text-gray-500">成熟度</span>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }} />
          <span className="text-sm font-medium">{cell.maturity_score} 分 — {tier.label}</span>
        </div>
      </div>
      <div>
        <span className="text-xs text-gray-500">官网链接</span>
        <p>
          <a href={cell.official_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
            {cell.official_url}
          </a>
        </p>
      </div>
      <div>
        <span className="text-xs text-gray-500">简短描述</span>
        <p className="text-sm text-gray-700">{cell.short_desc}</p>
      </div>
      {cell.report_url && (
        <div>
          <span className="text-xs text-gray-500">报告链接</span>
          <p>
            <a href={cell.report_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
              {cell.report_url}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function EditForm({
  form,
  setForm,
  tier,
}: {
  form: { tool_name: string; maturity_score: number; official_url: string; short_desc: string; report_url: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  tier: ReturnType<typeof getMaturityTier>;
}) {
  const upd = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500">工具名称 *</span>
        <input
          className="mt-0.5 w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={form.tool_name}
          onChange={(e) => upd("tool_name", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">
          成熟度分数 *：{form.maturity_score}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={0}
            max={100}
            value={form.maturity_score}
            onChange={(e) => upd("maturity_score", Number(e.target.value))}
            className="flex-1"
          />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }} />
            <span className="text-sm font-medium">{tier.label}</span>
          </div>
        </div>
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">官网链接 *</span>
        <input
          className="mt-0.5 w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={form.official_url}
          onChange={(e) => upd("official_url", e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">简短描述 *</span>
        <textarea
          className="mt-0.5 w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          rows={3}
          value={form.short_desc}
          onChange={(e) => upd("short_desc", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">报告链接（可选）</span>
        <input
          className="mt-0.5 w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={form.report_url}
          onChange={(e) => upd("report_url", e.target.value)}
          placeholder="https://..."
        />
      </label>
    </div>
  );
}
