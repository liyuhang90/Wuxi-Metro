---
title: 无锡地铁搜索验收
---
# 无锡地铁搜索验收

欢迎使用静态全文搜索。

## 中英文混合

无锡地铁 S1 线连接江阴。Wuxi Railway Station 提供换乘服务。

紧贴的词语：地铁S1线与铁路Railway交通。

## 顺序校验

这里分别提到无、锡、地、铁，不能当成连续中文词组命中。

## 表格与列表

| 车站 | 备注 |
| --- | --- |
| 表格专用词 | Platform twelve |

- 列表专用词可以定位。
- 第二项独立内容。

## 代码示例

```js
const codeSearchNeedle = 'CodeOnlyToken';
console.log(codeSearchNeedle);
```

## 重复段落一

重复段落独特词，应该定位到选中的这一处。

## 重复段落二

重复段落独特词，应该定位到选中的这一处。

## 安全渲染

HTML 字样：`<img src=x onerror=alert(1)>` 不应该执行。

## 原生输入

<input aria-label="普通输入框" />
<textarea aria-label="普通多行输入框"></textarea>
<select aria-label="普通选择框"><option>选项</option></select>
<div contenteditable="true" aria-label="可编辑内容">可编辑区域</div>

[另一个页面](./other)
