---
name: test-and-fix
description: Run ORRY’s available validation commands, diagnose failures, apply the smallest safe fix, and save a Markdown report under reports/. Use when verifying or stabilizing frontend changes in this repository.
version: 1.1.0
---

# Test And Fix

Use this skill for ORRY validation work.

## Required Flow

1. Detect available commands from `package.json` and `AGENTS.md`.
2. Prefer this order:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test` only if a real script exists
   - `npm run build`
3. Read failures carefully.
4. Apply the smallest correct fix.
5. Re-run only the affected commands after each meaningful fix.
6. Report pre-existing repository blockers honestly.

## 输出格式

```
# 测试与修复报告

> 生成时间: YYYY-MM-DD HH:mm
> 评审工具: frontend-craft

## 执行结果
| 命令 | 状态 | 说明 |
|------|------|------|
| lint | ✅ 通过 / ❌ 失败 | ... |
| type-check | ✅ 通过 / ❌ 失败 | ... |
| test | ✅ 通过 / ❌ 失败 | ... |
| build | ✅ 通过 / ❌ 失败 | ... |

## 发现的问题与修复
### 问题 1: ...
- **根因**: ...
- **修复**: ...
- **变更文件**: ...

## 剩余风险或未覆盖项
- ...
```

## 报告文件输出

修复完成后，必须将报告内容使用 Write 工具保存为 Markdown 文件：

- 目录：项目根目录下的 `reports/`（如不存在则创建）
- 文件名：`test-fix-YYYY-MM-DD-HHmmss.md`（使用当前时间戳）
- 保存后告知用户报告文件路径

## 强约束

- Do not hide failures by disabling checks.
- Do not weaken type safety just to get a pass.
- Do not rewrite unrelated modules because one nearby command failed.
