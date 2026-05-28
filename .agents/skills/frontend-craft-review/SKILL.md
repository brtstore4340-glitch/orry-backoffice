---
name: frontend-craft-review
description: Review ORRY frontend files or recent relevant Git changes, then save a prioritized Markdown report in reports/. Use when the user asks for frontend review, code review, or review of recent changes.
---

# Frontend Review With Git Scope

Review ORRY frontend code with repository-aware scope selection.

## 执行步骤

1. Determine scope:
   - If the user names files, review those files.
   - Otherwise inspect recent changed files from Git.
   - Exclude `.frontend-craft/`, `.next/`, generated logs, and report files unless the task is specifically about them.

2. Filter to frontend-relevant files such as `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.md` rules/docs when they affect frontend workflow.

3. **使用 frontend-code-review 的评审维度**逐项检查：
   - 架构（组件边界、职责分离）
   - 类型安全（any 使用、props 类型）
   - 渲染与状态（重复渲染、key 稳定性）
   - 样式（Token 使用、响应式）
   - 可访问性（语义化、ARIA、键盘操作）
   - 可维护性（文件体积、命名、重复逻辑）
   - 测试（关键覆盖、测试模式）
   - 安全（XSS、敏感信息、输入校验）

4. **按以下格式输出评审报告**：

```
# 代码审查报告

> 生成时间: YYYY-MM-DD HH:mm
> 评审工具: frontend-craft

**评审范围**: N 个文件

## 🔴 必须修改 (N项)
- **[文件:行号]** 问题描述 → 建议修改

## 🟡 建议优化 (N项)
- **[文件:行号]** 问题描述 → 建议修改

## 🔵 可选优化项 (N项)
- **[文件:行号]** 问题描述

## 🟢 做得好的地方
- ...

## 风险等级：低 / 中 / 高

**总体评价**: 可合并 / 待修改后合并 / 需要重构
```

5. **将报告保存为 Markdown 文件**：
   - 目录：项目根目录下的 `reports/`（如不存在则创建）
   - 文件名：`code-review-YYYY-MM-DD-HHmmss.md`（使用当前时间戳）
   - 保存后告知用户报告文件路径

6. If the user wants fixes, prioritize only the actionable must-fix issues and keep edits bounded.
