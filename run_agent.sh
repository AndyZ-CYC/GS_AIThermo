#!/bin/bash

# =============================================================================
# AI 行业温度计 WebApp - 自动化开发流程脚本
# =============================================================================
# 用法: ./run_agent.sh <次数>
# 示例: ./run_agent.sh 5  (运行5次开发流程)
#
# 功能:
#   - 自动调用 Claude Code 进行多次开发迭代
#   - 每次从 feature_list.json 中领取未完成的任务
#   - 自动处理权限，减少人为介入
#   - 记录详细日志
# =============================================================================

set -e

# ======================= 配置区域 =======================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志目录
LOG_DIR="./logs/agent_runs"
mkdir -p "$LOG_DIR"

# 时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MAIN_LOG="$LOG_DIR/run_${TIMESTAMP}.log"

# Claude Code 命令（可根据需要调整）
CLAUDE_CMD="claude"

# ======================= 辅助函数 =======================

log() {
    local level=$1
    shift
    local message="$@"
    local time=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${time} [${level}] ${message}" | tee -a "$MAIN_LOG"
}

log_info() {
    log "INFO" "${GREEN}$@${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$@${NC}"
}

log_error() {
    log "ERROR" "${RED}$@${NC}"
}

log_section() {
    echo "" | tee -a "$MAIN_LOG"
    echo "========================================" | tee -a "$MAIN_LOG"
    log "STEP" "${CYAN}$@${NC}"
    echo "========================================" | tee -a "$MAIN_LOG"
}

show_usage() {
    echo -e "${CYAN}用法:${NC}"
    echo "  $0 <运行次数>"
    echo ""
    echo -e "${CYAN}示例:${NC}"
    echo "  $0 5    # 运行5次开发流程"
    echo "  $0 10   # 运行10次开发流程"
    echo ""
    echo -e "${CYAN}说明:${NC}"
    echo "  每次运行会从 feature_list.json 中领取一个未完成的任务"
    echo "  并执行完整的开发流程（编码、测试、提交）"
    echo ""
    echo -e "${CYAN}日志位置:${NC}"
    echo "  $LOG_DIR/"
}

check_prerequisites() {
    log_section "检查前置条件"

    # 检查 claude 命令
    if ! command -v $CLAUDE_CMD &> /dev/null; then
        log_error "未找到 claude 命令，请确保 Claude Code 已安装并添加到 PATH"
        exit 1
    fi
    log_info "✓ Claude Code 已安装"

    # 检查必要的文件
    if [ ! -f "feature_list.json" ]; then
        log_error "未找到 feature_list.json"
        exit 1
    fi
    log_info "✓ feature_list.json 存在"

    if [ ! -f "CLAUDE.md" ]; then
        log_warn "! CLAUDE.md 不存在，Agent 可能缺少项目上下文"
    else
        log_info "✓ CLAUDE.md 存在"
    fi

    # 检查 git 仓库
    if [ ! -d ".git" ]; then
        log_error "当前目录不是 git 仓库"
        exit 1
    fi
    log_info "✓ Git 仓库已初始化"
}

get_pending_features() {
    # 获取未完成的功能数量
    if command -v jq &> /dev/null; then
        jq '[.features[] | select(.passes == false)] | length' feature_list.json
    else
        # 如果没有 jq，使用 grep 粗略统计
        grep -c '"passes": false' feature_list.json 2>/dev/null || echo "0"
    fi
}

# ======================= 初始 Prompt =======================

generate_prompt() {
    local run_number=$1
    local total_runs=$2

    cat << 'PROMPT_EOF'
你是一个专业的软件开发 Agent。请按照以下流程工作：

## 工作流程

### 1. 了解当前状态
首先执行以下命令了解项目状态：
- 运行 `pwd` 确认工作目录
- 阅读 `claude-progress.txt` 了解最新进度
- 阅读 `feature_list.json` 找到下一个未完成的任务（passes: false）
- 运行 `git log --oneline -5` 查看最近提交

### 2. 选择任务
从 feature_list.json 中选择 priority 值最小且 passes 为 false 的任务开始工作。

### 3. 执行开发
- 阅读相关 PRD 文档了解需求
- 编写代码实现功能
- 如果需要测试，可以创建 mock 数据进行测试
- 确保代码质量

### 4. 完成收尾
- 运行测试验证功能（如果适用）
- 提交 git commit，commit message 要清晰描述改动
- 更新 `claude-progress.txt` 记录本次工作
- 如果功能已完成并验证，更新 `feature_list.json` 中对应任务的 `passes` 为 true

## 重要规则

1. **遇到阻断问题**：如果遇到无法解决的问题，在 claude-progress.txt 中记录问题详情，并停止工作等待人工介入
2. **测试数据**：可以使用 mock 数据进行测试，不要等待真实数据
3. **增量开发**：每次只完成一个功能，不要一次性做太多
4. **代码质量**：确保每次提交的代码都是可工作的状态
5. **文档更新**：每次工作后都要更新进度文件

## 开始工作
请现在开始执行上述流程。
PROMPT_EOF
}

# ======================= 主函数 =======================

run_agent_iteration() {
    local current=$1
    local total=$2
    local iteration_log="$LOG_DIR/iteration_${current}_${TIMESTAMP}.log"

    log_section "运行第 ${current}/${total} 次开发流程"

    # 检查剩余任务
    local pending=$(get_pending_features)
    log_info "剩余未完成任务数: ${pending}"

    if [ "$pending" -eq 0 ]; then
        log_warn "所有任务已完成！无需继续运行。"
        return 0
    fi

    # 生成 prompt
    local prompt=$(generate_prompt $current $total)

    log_info "开始调用 Claude Code..."
    log_info "日志文件: ${iteration_log}"

    # 记录开始时间
    local start_time=$(date +%s)

    # 调用 Claude Code
    # 使用 --dangerously-skip-permissions 跳过权限确认
    # 使用 --allowedTools 指定允许的工具（可选，更安全）
    # 使用 --print 输出结果到日志
    local claude_exit_code=0

    echo "$prompt" | $CLAUDE_CMD \
        --dangerously-skip-permissions \
        --print \
        2>&1 | tee "$iteration_log" || claude_exit_code=$?

    # 记录结束时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    if [ $claude_exit_code -eq 0 ]; then
        log_info "✓ 第 ${current} 次运行完成 (耗时: ${minutes}分${seconds}秒)"
    else
        log_error "✗ 第 ${current} 次运行出错 (退出码: ${claude_exit_code})"
        log_error "请查看日志: ${iteration_log}"
        return 1
    fi

    # 显示当前进度
    local new_pending=$(get_pending_features)
    local completed=$((pending - new_pending))
    log_info "本次完成: ${completed} 个任务, 剩余: ${new_pending} 个任务"

    return 0
}

main() {
    # 检查参数
    if [ $# -ne 1 ]; then
        show_usage
        exit 1
    fi

    # 验证参数是数字
    if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        log_error "参数必须是正整数"
        show_usage
        exit 1
    fi

    local total_runs=$1

    if [ $total_runs -lt 1 ]; then
        log_error "运行次数必须大于 0"
        exit 1
    fi

    # 打印欢迎信息
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     AI 行业温度计 WebApp - 自动化开发流程                   ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    log_info "计划运行次数: ${total_runs}"
    log_info "主日志文件: ${MAIN_LOG}"

    # 检查前置条件
    check_prerequisites

    # 显示初始状态
    local initial_pending=$(get_pending_features)
    log_info "初始待完成任务数: ${initial_pending}"

    # 记录总开始时间
    local total_start=$(date +%s)

    # 运行循环
    local success_count=0
    local fail_count=0

    for ((i=1; i<=total_runs; i++)); do
        if run_agent_iteration $i $total_runs; then
            ((success_count++))
        else
            ((fail_count++))
            log_warn "第 ${i} 次运行失败，是否继续？(y/n)"
            # 在自动化模式下继续运行，如需人工确认可取消下面的注释
            # read -r continue
            # if [[ ! "$continue" =~ ^[Yy]$ ]]; then
            #     log_info "用户中止运行"
            #     break
            # fi
        fi

        # 检查是否还有任务
        local current_pending=$(get_pending_features)
        if [ "$current_pending" -eq 0 ]; then
            log_info "🎉 所有任务已完成！"
            break
        fi

        # 迭代间隔（可选）
        if [ $i -lt $total_runs ]; then
            log_info "等待 2 秒后开始下一次运行..."
            sleep 2
        fi
    done

    # 计算总耗时
    local total_end=$(date +%s)
    local total_duration=$((total_end - total_start))
    local total_minutes=$((total_duration / 60))
    local total_seconds=$((total_duration % 60))

    # 打印总结
    echo ""
    log_section "运行总结"
    log_info "总运行次数: ${success_count} 成功, ${fail_count} 失败"
    log_info "总耗时: ${total_minutes} 分 ${total_seconds} 秒"
    log_info "剩余任务: $(get_pending_features)"

    local final_pending=$(get_pending_features)
    local completed_total=$((initial_pending - final_pending))
    log_info "本次共完成: ${completed_total} 个任务"

    echo ""
    log_info "详细日志请查看: ${LOG_DIR}/"
}

# 运行主函数
main "$@"
