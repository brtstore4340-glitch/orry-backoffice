---
name: nextjs-project-standard
description: ORRY Next.js App Router standards for route structure, data loading, protected back-office pages, middleware, and deployable changes. Use when editing pages or route-adjacent modules in this repo.
version: 1.0.0
---

# ORRY Next.js Standards

Apply this to ORRY’s Next.js App Router repository.

## 适用场景

- 新建或修改 App Router 页面
- 配置 SSR / SSG / ISR
- 使用流式渲染、Suspense
- 数据获取、缓存、中间件
- 元数据与 SEO

## Repository Structure

```
src/
├── app/
│   ├── (auth)/
│   ├── (protected)/
│   ├── api/
│   ├── globals.css
├── components/
├── lib/
└── utils/
```

## 渲染模式

| 模式 | 使用场景 | 实现方式 |
|------|----------|----------|
| **SSR** | 动态、需实时数据 | 默认，`fetch` 不缓存或 `cache: 'no-store'` |
| **SSG** | 静态内容 | `generateStaticParams` + 静态 `fetch` |
| **ISR** | 定期更新 | `revalidate` 或 `revalidatePath` |
| **CSR** | 客户端交互 | `'use client'` + `useEffect` 或 SWR/React Query |

## 数据获取

- Prefer server components and server-side data loading first.
- Use client components only for real interaction needs.
- Keep privileged data access in server files and `src/lib/*`.
- Align auth-sensitive flows with `src/middleware.ts`, `src/auth.ts`, and current Supabase/Prisma helpers.

## 路由与布局

- Route groups like `(auth)` and `(protected)` should preserve current ORRY organization.
- Dynamic routes should match the existing document, contact, product, and settings patterns already in `src/app/(protected)/`.
- New routes should fit existing layout composition instead of creating a parallel route hierarchy.

## 中间件

- Keep middleware focused on auth/session and routing concerns already established in the repo.
- Avoid moving heavy business logic into middleware.

## 元数据与 SEO

- Add metadata when useful, but do not invent marketing SEO requirements for internal back-office screens.

## 强约束

- Default to server components.
- Do not use browser APIs in server components.
- Keep auth, approval, and privileged logic on the server.
- Preserve deployability and current ORRY patterns before applying generic Next.js abstractions.
