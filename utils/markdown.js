// utils/markdown.js

/**
 * 强化版 Markdown 转 HTML (完全适配微信小程序 rich-text)
 * 支持多级标题、加粗、斜体、代码块、列表，以及**表格**的精准解析
 */
function parseMarkdown(text) {
  if (!text) return '';
  let html = text;

  // 1. 统一换行符并进行基础防注入转义
  html = html.replace(/\r\n/g, '\n');
  // 注意：只转义最基础的 <> 符号，避免富文本解析错误
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 2. 多行代码块 (带语言与不带语言)
  html = html.replace(/```\w*\n([\s\S]*?)```/g, function(match, p1) {
    return `<div style="background:#282c34; color:#abb2bf; padding:20rpx; border-radius:12rpx; margin:16rpx 0; overflow-x:scroll; font-family:monospace; font-size:26rpx; white-space:pre;">${p1}</div>`;
  });
  html = html.replace(/```([\s\S]*?)```/g, function(match, p1) {
    return `<div style="background:#282c34; color:#abb2bf; padding:20rpx; border-radius:12rpx; margin:16rpx 0; overflow-x:scroll; font-family:monospace; font-size:26rpx; white-space:pre;">${p1}</div>`;
  });

  // 3. 内联代码块
  html = html.replace(/`([^`\n]+)`/g, '<span style="background:#f0f0f0; border-radius:6rpx; padding:4rpx 8rpx; color:#e83e8c; font-family:monospace; font-size:26rpx; margin:0 4rpx;">$1</span>');

  // 4. 加粗与斜体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:bold; color:#202123;">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong style="font-weight:bold; color:#202123;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style:italic; color:#202123;">$1</em>');

  // 5. 标题 (需匹配开头，支持打字机过程中的实时解析)
  html = html.replace(/^###\s+(.*)$/gm, '<h3 style="font-size:32rpx; font-weight:bold; margin-top:20rpx; margin-bottom:12rpx; color:#202123;">$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2 style="font-size:36rpx; font-weight:bold; margin-top:24rpx; margin-bottom:12rpx; color:#202123;">$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1 style="font-size:40rpx; font-weight:bold; margin-top:28rpx; margin-bottom:12rpx; color:#202123;">$1</h1>');

  // 6. 无序列表和有序列表
  html = html.replace(/^-\s+(.*)$/gm, '<div style="margin-left:20rpx; margin-bottom:8rpx; display:flex;"><span style="margin-right:12rpx; color:#666;">•</span><span style="flex:1;">$1</span></div>');
  html = html.replace(/^\*\s+(.*)$/gm, '<div style="margin-left:20rpx; margin-bottom:8rpx; display:flex;"><span style="margin-right:12rpx; color:#666;">•</span><span style="flex:1;">$1</span></div>');
  html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<div style="margin-left:20rpx; margin-bottom:8rpx; display:flex;"><span style="margin-right:12rpx; font-weight:500;">$1.</span><span style="flex:1;">$2</span></div>');

  // 7. AI 常用 Markdown 表格解析 (完美兼容显示器参数对比等)
  // 匹配连续的含有 `|` 的多行字符串
  html = html.replace(/(?:^\|.+?\|\n?)+/gm, (match) => {
    let lines = match.trim().split('\n');
    if (lines.length < 2) return match; // 必须至少有表头和分隔线

    // 检查第二行是否是标准的 Markdown 表格分隔线 (如 | --- | --- |)
    if (!lines[1].includes('-')) return match;

    let res = `<table style="border-collapse:collapse; width:100%; font-size:26rpx; margin:24rpx 0; border:1px solid #e5e5e5; text-align:left;">`;
    
    // 解析表头 (Thead)
    let headers = lines[0].split('|').map(s => s.trim()).filter((s, i, a) => !(s === '' && (i === 0 || i === a.length - 1)));
    res += `<thead style="background-color:#f7f7f8;"><tr>`;
    headers.forEach(h => {
      res += `<th style="padding:16rpx 12rpx; font-weight:600; color:#333; border:1px solid #e5e5e5;">${h}</th>`;
    });
    res += `</tr></thead><tbody>`;
    
    // 解析表身 (Tbody)
    for (let i = 2; i < lines.length; i++) {
      let cols = lines[i].split('|').map(s => s.trim()).filter((s, idx, a) => !(s === '' && (idx === 0 || idx === a.length - 1)));
      res += `<tr>`;
      cols.forEach(c => {
        res += `<td style="padding:16rpx 12rpx; border:1px solid #e5e5e5; word-break:break-all; color:#333;">${c}</td>`;
      });
      res += `</tr>`;
    }
    res += `</tbody></table>`;
    return res;
  });

  // 8. 智能换行处理 (防止打断我们在上面生成的 div/table 块级元素)
  let parsed = html.split('\n').join('<br>');
  // 清理块级元素旁边多余的空换行
  parsed = parsed.replace(/(<\/?(div|table|thead|tbody|tr|th|td|h1|h2|h3)[^>]*>)<br>/g, '$1');
  parsed = parsed.replace(/<br>(<\/?(div|table|thead|tbody|tr|th|td|h1|h2|h3)[^>]*>)/g, '$1');

  // 对全局统一增加样式容器
  return `<div style="font-size:32rpx; line-height:1.7; word-wrap:break-word; color:#374151;">${parsed}</div>`;
}

module.exports = {
  parseMarkdown
};