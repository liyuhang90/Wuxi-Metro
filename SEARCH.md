# 独立全文搜索使用与交付说明

在现有 VitePress 1.6.4 默认主题上实现，继续使用 pnpm、GitHub 和 Vercel 静态部署。正式命令仍是 `pnpm docs:build`，无需服务端、数据库、Docker、API Key 或新增部署步骤。

## 技术选择

选择 **MiniSearch 7.2.0**。它提供字段权重、前缀、编辑距离容错及 JSON 序列化，运行时没有外部依赖。VitePress 已间接使用 MiniSearch，本次把独立搜索需要的版本声明为直接依赖，不再调用原生搜索组件。

开发前比较依据：[MiniSearch 官方文档](https://lucaong.github.io/minisearch/)、[FlexSearch 官方项目](https://github.com/nextapps-de/flexsearch)。

| 比较项 | 本项目取舍 |
| --- | --- |
| 中文、中英文混合 | 两者都需要明确配置匹配策略。这里使用 MiniSearch 自定义中文字符切分及连续词组校验，不使用默认空格分词。FlexSearch 的 CJK/编码能力并不自动保证本项目的连续词组与位置要求。 |
| 模糊、排序 | MiniSearch 直接提供前缀、编辑距离、字段权重及分数；方便限制仅英文拼写容错，并在其上实现明确的相关性等级。FlexSearch 的分词、编码、建议与多字段结果组合需要另一套配置。 |
| 构建、加载 | 两者均能在 Node/浏览器本地运行并导出/导入索引；MiniSearch 的单一 JSON 接口符合当前站点规模。 |
| 体积、性能 | 最终索引实测 401,401 字节，gzip 86,930 字节；本机 30 次查询采样 P95 约 0.7–1.4 ms。未对两库做同语料横向基准，不以厂商性能倍数作为选择依据。 |
| 浏览器、VitePress、Vercel | 两者的内存模式均可静态部署；当前采用的方案已通过 VitePress 正式构建与 Chrome 验证。 |
| 维护及依赖复杂度 | 两个项目均有官方文档与公开源码；不保证未来维护状态。MiniSearch 的现有依赖关系和接口更符合此次需求；无需引入 FlexSearch 的其他可选能力。 |

当前仅 16 页，采用一个索引、内存缓存和 140 ms 防抖；没有为此规模增加分片或 Worker。后续文档量显著增长时，应先重新测量压缩体积、初始化与查询耗时，再决定分片。

## 构建与检索流程

1. Markdown 编译插件为标题、段落、列表项、表格行和代码块添加 `data-search-id`。标识由块类型、源码内容的 SHA-256 前缀及同文重复序号构成；相同内容在相同页面内可以区分，前方插入不同文字不会改变原标识。
2. 从同一次 Markdown 渲染的 HTML 提取可定位内容。只读取文章内容，不扫描导航、侧边栏、页脚等主题 UI；HTML 实体按实际可见文字解码。标题命中额外保存附近正文摘要，不把该摘要重复加入倒排索引。
3. `buildEnd` 序列化 MiniSearch，写入 `docs/.vitepress/dist/search-index.json`，随原有构建产物部署。构建失败不会被吞掉。
4. 页面初次加载仅提供搜索入口。第一次打开才动态加载弹窗/搜索引擎并请求 `${base}search-index.json`。同一浏览器页面生命周期内复用加载 Promise 和引擎；失败清除缓存，可重试，网络等待上限 20 秒。
5. 所有查询均在浏览器本地运行。请求 URL 不包含关键词，使用正常同源静态文件请求。索引按 `no-cache` 策略校验，开发模式重新打开时刷新索引。
6. 开发模式由 Vite 插件扫描当前站点页面并生成索引响应，监听 Markdown 变化。该开发中间件不会部署，也不改变生产环境纯静态架构。MiniSearch 在开发启动时预构建，避免首次打开弹窗导致 Vite 重载。

## 匹配与排序

- 文本先进行 NFKC 归一化并转小写；按中文和其他字母/数字边界切分。因此 `地铁S1线` 不需要用户手动插入空格。
- 中文建立字符 unigram 索引，支持任意长度的中文片段。召回后检查查询中的每段连续中文必须连续出现在记录中，排除散字、颠倒顺序的误命中。
- 查询词采用 AND 语义。英文至少 2 字符才做前缀匹配；纯英文字母至少 4 字符才允许 1 次编辑距离。单字只做精确匹配，中文不做编辑距离扩展。
- 排序依次优先：完整页面标题、标题包含、小标题、正文短语、其他精确词命中、英文模糊命中；同等级使用 MiniSearch 字段权重和相关性分数。代码权重低于正文。
- 结果按页面聚合，保留每个不同定位点，提供“展开其余匹配”；首次显示 10 个页面，可继续加载。摘要长度约 180 字符，围绕命中位置截取。
- 使用 Vue 文本插值及 `<mark>` 渲染高亮，不使用 `v-html` 或 HTML 字符串注入。

## 定位与交互

点击结果通过 VitePress Router 导航至 `#search-…`；路由渲染后寻找精确的 `data-search-id`，滚动并高亮 3.5 秒。原有标题的 `id`、原有标题锚点均保持不变。相同页面保留当前查询参数，前进/后退及直接打开定位链接均能重新定位。首页标题命中突出显示实际 Hero 区域。

默认入口为全站搜索；Ctrl/Command+K 打开全站，Ctrl/Command+F 打开当前页。当前页范围规范化 `.html`、`index`、查询参数与 Hash，并在路由变更时更新。输入框、文本域、选择框、可编辑区域中的全局快捷键不拦截；搜索框内部允许切换范围。

支持 ↑/↓、Enter、Esc、Tab/Shift+Tab 循环、中文输入法组合输入、防抖期间清除旧结果、关闭后恢复焦点和滚动。使用原生模态 dialog 与主题颜色变量，适配亮暗色、触控和移动可视窗口变化。

## 排除配置

编辑 `docs/.vitepress/search/config.ts`，路径相对 `docs/`，使用 `/`：

```ts
export const searchConfig = {
  exclude: ['private/', 'draft.md', 'line_intro/internal.md']
}
```

目录规则以 `/` 结尾；文件规则为精确路径，不使用 glob。单页也可写：

```yaml
---
search: false
---
```

默认排除 `404.md`、`.vitepress`、`node_modules`、`dist`、`cache`。修改后重新构建，开发配置变更由 VitePress 重启配置。排除仅影响搜索，不限制页面访问。

索引对象是 Markdown 编译出的静态文章文本；不提取 PDF、音视频内容或 Vue 组件运行后动态生成的文字。

## 文件清单

修改：

- `docs/.vitepress/config.mts`：接入 Markdown/Vite/buildEnd 钩子，删除原生 `themeConfig.search`。
- `docs/.vitepress/theme/index.ts`：通过默认主题导航插槽加入唯一搜索入口。
- `package.json`、`pnpm-lock.yaml`：声明依赖及测试命令，保留原构建脚本。
- `.gitignore`：忽略浏览器测试产物。

新增：

- `docs/.vitepress/search/build.ts`：内容提取、定位标识、构建/开发索引。
- `docs/.vitepress/search/config.ts`：排除规则。
- `docs/.vitepress/search/shared.ts`：类型、分词、查询、排序、摘要、高亮切片。
- `docs/.vitepress/search/client.ts`：索引加载、缓存、超时及失败恢复。
- `docs/.vitepress/theme/components/search/SearchLauncher.vue`：入口、快捷键、路由定位。
- `docs/.vitepress/theme/components/search/SearchDialog.vue`：搜索弹窗、结果、焦点及响应式布局。
- `docs/.vitepress/theme/components/search/SearchHighlight.vue`：安全文字高亮。
- `tsconfig.search.json`、`playwright.config.ts`：类型检查与真实浏览器测试配置。
- `tests/search.test.mts`、`tests/search.browser.ts`：搜索逻辑、DOM 对应和浏览器回归。
- `tests/fixtures/.vitepress/config.mts`、`tests/fixtures/.vitepress/theme/index.ts`：非根路径验收站点。
- `tests/fixtures/index.md`、`other.md`、`hidden.md`、`404.md`：表格、代码、重复内容、排除等验收语料，不进入正式网站。
- `SEARCH.md`：本文档。

未删除源文件。原项目没有单独安装的原生搜索依赖；VitePress 自身的传递依赖仍由其管理，不修改 `node_modules` 源码。浏览器已确认不存在两套搜索入口。原公告、换乘、首页动画、侧边栏和文章内容未改动。

## 运行与复验

```sh
pnpm install --frozen-lockfile
pnpm docs:dev

# 正式构建与预览
pnpm docs:build
pnpm docs:preview

# 自动验收（按顺序执行）
pnpm search:typecheck
pnpm docs:build
pnpm search:fixtures
pnpm search:test
pnpm search:e2e
```

浏览器测试默认使用已安装的 Chrome，并自动启动/关闭 4173、4174、4175 三个本地测试端口。其他机器需先安装 Chrome，或将 Playwright 配置改用该机器已安装的浏览器。该条件仅用于开发验收，不影响 Vercel 正式构建。

## 验收记录与边界

2026-10-30，Windows、Node 24.17.0、pnpm 11.24.0、VitePress 1.6.4：

- 原命令 `pnpm docs:build` 成功；生产索引覆盖 16 页，392.0 KiB 原始 JSON，约 84.9 KiB gzip（压缩测量值，实际传输压缩由静态托管处理）。
- 搜索模块类型检查通过；7 项逻辑测试通过，含实际全站每一条索引目标与产出 HTML 的对应检查。
- 10 项 Chrome 浏览器用例全部通过，覆盖全站/当前页、中文/混合/模糊、摘要高亮、精确定位、3.5 秒取消高亮、重复段落、表格/代码/列表、无结果、加载失败重试、首次按需下载和缓存。
- 覆盖 Ctrl/Meta 快捷键、上下键/Enter/Esc、输入法、编辑区域例外、焦点循环/恢复、路由变更、前进后退、查询参数及原有标题锚点。
- 使用实际构建的 `/metro-test/` 子路径验证索引与导航。检查桌面、390px 手机布局、820px 平板触控模拟、亮暗色截图及窗口缩小后的布局；也验证开发服务器的未访问页面检索。

未执行 GitHub 推送或 Vercel 线上部署；已验证的是与原部署流程相同的本地静态构建。macOS 的 Meta 事件在 Windows Chrome 中模拟验证，未在实体 Mac、iOS Safari、实体手机软键盘上实测。

