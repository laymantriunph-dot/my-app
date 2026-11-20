# 三分待办

一个面向个人使用的手机待办 App。它把任务分成三个清晰层级：

- **朝计**：今天需要完成的事，并分为「Primary / Secondly.」
- **遐筹**：需要持续推进、没有当天截止压力的事
- **次重要**：有空时再处理的事

当前版本分为「朝计」与「记录」两个主栏目：

- **朝计**：将当天待办分为「Primary / Secondly.」，将长期事项放入「遐筹」，并且只在朝计清单显示当日可展开的已完成区域。
- **记录**：点击中央计时圆设置倒计时，提供自定义倒计时和正计时，开始后自动进入全屏沉浸模式，并保存每次专注的时长、名称和时间。
- **Accomplished**：完成事项自动按「朝计 / 遐筹」并列保存，可勾选记录后批量抹除。

同时支持本地离线保存，以及 Google、Outlook、QQ 三种账号登录后的云端同步。

## 技术方案

- **App**：Expo 58、React Native、TypeScript
- **账号与数据库**：Supabase Auth + Postgres
- **登录方式**：Google、Microsoft/Azure、QQ 互联
- **本地缓存**：Expo SecureStore 与 AsyncStorage
- **数据保护**：Supabase Row Level Security，每位用户只能读写自己的待办

## 本地运行

先安装 Node.js 20 或更高版本，然后执行：

```bash
npm install
npx expo start
```

使用手机上的 Expo Go 扫描终端二维码即可预览。没有配置登录服务时，可以先点击“先在本机使用”，所有核心功能都能体验。

生成可部署的静态网页版：

```bash
npm run build:web
```

生成结果位于 `web-dist/`，可以部署到任意支持静态网站的托管平台。

## 配置 Supabase

1. 在 [Supabase](https://supabase.com/) 创建项目。
2. 打开项目的 SQL Editor，依次执行：

   [`supabase/migrations/202611190001_create_tasks.sql`](supabase/migrations/202611190001_create_tasks.sql)
   [`supabase/migrations/202611200001_add_archives_and_focus_sessions.sql`](supabase/migrations/202611200001_add_archives_and_focus_sessions.sql)
   [`supabase/migrations/202611200002_refine_today_priorities.sql`](supabase/migrations/202611200002_refine_today_priorities.sql)
   [`supabase/migrations/202611200003_auto_completion_history.sql`](supabase/migrations/202611200003_auto_completion_history.sql)

3. 将 [`.env.example`](.env.example) 复制为 `.env`，填写 Project URL 和 Publishable key：

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   EXPO_PUBLIC_QQ_PROVIDER_ID=custom:qq
   ```

4. 在 **Authentication > URL Configuration** 中加入回调地址：

   ```text
   sanfen://**
   exp://**
   ```

   正式构建时还应加入 EAS 开发构建或独立安装包的完整回调地址。

## 配置 Google 与 Outlook

### Google

1. 在 Google Cloud Console 创建 OAuth 2.0 Client。
2. 应用类型选择 **Web application**。
3. 将 Supabase 中 Google Provider 页面显示的 Callback URL 填入 Google 的 Authorized redirect URI。
4. 把 Google Client ID 和 Client Secret 填入 Supabase 的 Google Provider 设置并启用。

### Outlook / Microsoft

1. 在 Microsoft Entra 管理中心创建 App registration。
2. 添加 Web Redirect URI，值使用 Supabase 中 Azure Provider 页面显示的 Callback URL。
3. 在 Supabase 的 Azure Provider 中填写 Tenant、Client ID 和 Client Secret 并启用。

## 配置 QQ 登录

QQ 互联没有提供标准 OIDC 接口，因此不能只填写应用 ID 和密钥。本仓库已经包含两个 Supabase Edge Function，把 QQ 的非标准接口转换为 Supabase 可识别的标准返回。

1. 在 [QQ 互联](https://connect.qq.com/) 创建网站应用，获得 APP ID 与 APP Key。
2. 在 Supabase 的 **Authentication > Sign In / Providers > Custom OAuth Providers** 新建 Provider，标识填写 `qq`，最终客户端会使用 `custom:qq`。
3. 将 Supabase 提供的 Callback URL 登记到 QQ 互联的回调地址。
4. 安装并登录 [Supabase CLI](https://supabase.com/docs/guides/cli)，在项目根目录关联项目：

   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

5. 设置代理签名密钥：

   ```bash
   supabase secrets set QQ_PROXY_SECRET=请换成至少32位随机字符串
   ```

6. 部署 QQ 代理函数：

   ```bash
   supabase functions deploy qq-token --no-verify-jwt
   supabase functions deploy qq-userinfo --no-verify-jwt
   ```

7. 在 Supabase 自定义 Provider 中填写：

   ```text
   Authorization URL:
   https://graph.qq.com/oauth2.0/authorize

   Token URL:
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/qq-token

   Userinfo URL:
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/qq-userinfo

   Scopes:
   get_user_info

   Client ID:
   QQ 互联 APP ID

   Client Secret:
   QQ 互联 APP Key
   ```

8. 将唯一用户标识映射到 `sub`，昵称映射到 `name`，头像映射到 `picture`。

> QQ 账号通常不会返回邮箱，因此 QQ 用户可能没有邮箱字段。这是 QQ 开放平台本身的限制。

## 构建手机安装包

项目已包含 [`eas.json`](eas.json)。安装 EAS CLI 后：

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

iOS 构建需要 Apple Developer 账号。生产发布前，请在 EAS 项目环境变量中配置同样的 `EXPO_PUBLIC_SUPABASE_*` 变量，不要提交 `.env`。

## 数据与安全

- 未登录数据保存在本机缓存中。
- 用户第一次登录时，如果本机已有待办，App 会尝试将这些任务迁移到该账号。
- 云端任务通过数据库 RLS 隔离，客户端公开密钥无法绕过用户行级权限。
- 登录会话在手机端使用 SecureStore 分段保存。
- QQ 代理服务不会把 QQ Access Token 直接交给 App，只返回短时签名令牌供 Supabase 拉取资料。

## 目录

```text
src/
  components/       页面和组件
  hooks/            登录、任务状态与云端同步
  lib/              Supabase 客户端和任务仓库
supabase/
  functions/        QQ OAuth 转换代理
  migrations/       数据库表、RLS 与触发器
```

下一步可继续加入截止日期、提醒通知、拖拽排序、周回顾和 Android/iOS 桌面小组件。
