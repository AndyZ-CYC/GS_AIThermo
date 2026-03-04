import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ToolCell, GameType, RoleGroup } from "../types";
import { getMaturityTier } from "../utils/maturity";
import {
  useCreateToolCell,
  useUpdateToolCell,
  useDeleteToolCell,
  useUploadIcon,
  useDeleteIcon,
} from "../hooks/useToolCells";

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
  const uploadIconMut = useUploadIcon();
  const deleteIconMut = useDeleteIcon();

  const [isNa, setIsNa] = useState(false);

  const [form, setForm] = useState({
    tool_name: cell?.tool_name ?? "",
    maturity_score: cell?.maturity_score ?? 50,
    official_url: cell?.official_url ?? "",
    short_desc: cell?.short_desc ?? "",
    report_url: cell?.report_url ?? "",
  });

  useEffect(() => {
    if (cell && mode === "edit") {
      if (cell.is_na) {
        setIsNa(false);
        setForm({
          tool_name: "",
          maturity_score: 50,
          official_url: "",
          short_desc: "",
          report_url: "",
        });
      } else {
        setForm({
          tool_name: cell.tool_name,
          maturity_score: cell.maturity_score,
          official_url: cell.official_url,
          short_desc: cell.short_desc,
          report_url: cell.report_url ?? "",
        });
      }
    }
  }, [cell, mode]);

  const effectiveGtId = cell?.game_type_id ?? gameTypeId;
  const effectiveRoleId = cell?.role_id ?? roleId;
  const gtName = gameTypes.find((g) => g.id === effectiveGtId)?.name ?? "";
  const allRoles = roleGroups.flatMap((rg) => rg.roles);
  const roleName = allRoles.find((r) => r.id === effectiveRoleId)?.name ?? "";

  const tier = getMaturityTier(form.maturity_score);

  const handleSubmit = async () => {
    if (isNa) {
      if (mode === "create" && effectiveGtId && effectiveRoleId) {
        await createMutation.mutateAsync({
          game_type_id: effectiveGtId,
          role_id: effectiveRoleId,
          is_na: true,
        });
      }
      handleAnimatedClose();
      return;
    }

    const data = {
      ...form,
      is_na: false,
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
    handleAnimatedClose();
  };

  const handleDelete = async () => {
    if (cell && confirm("确定要删除这个工具卡片吗？")) {
      await deleteMutation.mutateAsync(cell.id);
      handleAnimatedClose();
    }
  };

  const iconFileRef = useRef<HTMLInputElement>(null);
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && cell) {
      await uploadIconMut.mutateAsync({ cellId: cell.id, file: e.target.files[0] });
    }
  };
  const handleIconDelete = async () => {
    if (cell) await deleteIconMut.mutateAsync(cell.id);
  };

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleAnimatedClose = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };

  const isViewNa = mode === "view" && cell?.is_na;

  const title = isViewNa
    ? "不适用标记"
    : mode === "create"
      ? "添加工具卡片"
      : mode === "edit"
        ? "编辑工具卡片"
        : "工具详情";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleAnimatedClose}
    >
      <div
        className={`bg-bg-elevated rounded-xl w-full max-w-lg mx-4 overflow-hidden transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={handleAnimatedClose}
            className="text-text-muted hover:text-text-secondary text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>
              游戏类型：<strong className="text-text-primary">{gtName}</strong>
            </span>
            <span>
              工种：<strong className="text-text-primary">{roleName}</strong>
            </span>
          </div>

          {isViewNa ? (
            <NaViewContent />
          ) : mode === "view" && cell ? (
            <ViewContent
              cell={cell}
              tier={tier}
              onIconUpload={() => iconFileRef.current?.click()}
              onIconDelete={handleIconDelete}
            />
          ) : (
            <>
              {mode === "create" && (
                <NaToggle isNa={isNa} onChange={setIsNa} />
              )}
              {!isNa && <EditForm form={form} setForm={setForm} tier={tier} />}
            </>
          )}
          <input
            ref={iconFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIconUpload}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between">
          {isViewNa ? (
            <>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                移除标记
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleAnimatedClose}
                  className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-md transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={onSwitchEdit}
                  className="px-4 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
                >
                  转为工具卡片
                </button>
              </div>
            </>
          ) : mode === "view" ? (
            <>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                删除
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleAnimatedClose}
                  className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-md transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={onSwitchEdit}
                  className="px-4 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
                >
                  编辑
                </button>
              </div>
            </>
          ) : (
            <>
              <div />
              <div className="flex gap-2">
                <button
                  onClick={handleAnimatedClose}
                  className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-md transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isNa && (!form.tool_name || !form.official_url || !form.short_desc)}
                  className="px-4 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-40 transition-colors"
                >
                  保存
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function NaToggle({
  isNa,
  onChange,
}: {
  isNa: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border cursor-pointer select-none group hover:border-accent/30 transition-colors">
      <input
        type="checkbox"
        checked={isNa}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 rounded-full bg-text-muted/30 peer-checked:bg-accent/70 relative transition-colors">
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
          style={{ transform: isNa ? "translateX(16px)" : "translateX(0)" }}
        />
      </div>
      <div>
        <span className="text-sm text-text-primary font-medium">标记为「不适用」</span>
        <p className="text-xs text-text-muted mt-0.5">该游戏类型与工种的组合没有实际意义</p>
      </div>
    </label>
  );
}

function NaViewContent() {
  return (
    <div className="flex flex-col items-center py-6 gap-3">
      <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center">
        <svg
          className="w-8 h-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <p className="text-text-secondary text-sm">该组合已标记为「不适用」</p>
      <p className="text-text-muted text-xs">表示此游戏类型与工种的组合没有实际意义</p>
    </div>
  );
}

function ViewContent({
  cell,
  tier,
  onIconUpload,
  onIconDelete,
}: {
  cell: ToolCell;
  tier: ReturnType<typeof getMaturityTier>;
  onIconUpload: () => void;
  onIconDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {cell.icon_path ? (
          <div className="relative group">
            <img
              src={cell.icon_path}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-border"
            />
            <button
              onClick={onIconDelete}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        ) : (
          <button
            onClick={onIconUpload}
            className="w-12 h-12 rounded-lg border border-dashed border-text-muted/40 flex items-center justify-center hover:border-accent/60 transition-colors group"
          >
            <svg
              className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </button>
        )}
        <div>
          <p className="font-semibold text-text-primary">{cell.tool_name}</p>
          <button
            onClick={cell.icon_path ? undefined : onIconUpload}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            {cell.icon_path ? "已上传 Icon" : "上传 Icon"}
          </button>
        </div>
      </div>
      <div>
        <span className="text-xs text-text-muted">成熟度</span>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }} />
          <span className="text-sm font-medium text-text-primary">
            {cell.maturity_score} 分 — {tier.label}
          </span>
        </div>
      </div>
      <div>
        <span className="text-xs text-text-muted">官网链接</span>
        <p>
          <a
            href={cell.official_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-hover text-sm break-all transition-colors"
          >
            {cell.official_url}
          </a>
        </p>
      </div>
      <div>
        <span className="text-xs text-text-muted">简短描述</span>
        <p className="text-sm text-text-secondary">{cell.short_desc}</p>
      </div>
      {cell.report_url && (
        <div>
          <span className="text-xs text-text-muted">报告链接</span>
          <p>
            <a
              href={cell.report_url}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-hover text-sm break-all transition-colors"
            >
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
  form: {
    tool_name: string;
    maturity_score: number;
    official_url: string;
    short_desc: string;
    report_url: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  tier: ReturnType<typeof getMaturityTier>;
}) {
  const upd = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const inputCls =
    "mt-0.5 w-full bg-bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:ring-2 focus:ring-accent/40 focus:border-accent/60 outline-none transition-colors";

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs text-text-muted">工具名称 *</span>
        <input
          className={inputCls}
          value={form.tool_name}
          onChange={(e) => upd("tool_name", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-muted">
          成熟度分数 *：{form.maturity_score}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={0}
            max={100}
            value={form.maturity_score}
            onChange={(e) => upd("maturity_score", Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }} />
            <span className="text-sm font-medium text-text-primary">{tier.label}</span>
          </div>
        </div>
      </label>

      <label className="block">
        <span className="text-xs text-text-muted">官网链接 *</span>
        <input
          className={inputCls}
          value={form.official_url}
          onChange={(e) => upd("official_url", e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-muted">简短描述 *</span>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={form.short_desc}
          onChange={(e) => upd("short_desc", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-muted">报告链接（可选）</span>
        <input
          className={inputCls}
          value={form.report_url}
          onChange={(e) => upd("report_url", e.target.value)}
          placeholder="https://..."
        />
      </label>
    </div>
  );
}
