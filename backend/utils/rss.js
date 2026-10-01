const FEED_TITLE = 'Vorest 博客'
const FEED_DESCRIPTION = '记录开发、灵感和日常更新。订阅博客概览，阅读全文请访问原文。'

const escapeXml = (value) => String(value ?? '')
  // XML 1.0 不接受控制字符和孤立代理项。
  .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const getDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// 模板只包含文章概览；动态文本先转义为 HTML，再作为 XML 文本编码。
const renderOverview = (blog, articleUrl, date) => {
  const tags = (blog.tags || []).map(escapeXml).filter(Boolean)
  return `<article>
  <h2>${escapeXml(blog.title)}</h2>
  <p>${date ? dateFormatter.format(date) : '未知日期'} · ${escapeXml(blog.category || '未分类')}</p>
  ${tags.length ? `<p>标签：${tags.join(' / ')}</p>` : ''}
  <p>${escapeXml(blog.excerpt || '暂无摘要。').replace(/\r?\n/g, '<br>')}</p>
  <p><a href="${escapeXml(articleUrl)}">阅读全文 →</a></p>
  <hr>
  <p>爷爷您关注的博主更新辣！快来看看吧(*^▽^*)~</p>
</article>`
}

const createRssFeed = (blogs, { siteUrl, feedUrl }) => {
  const items = blogs.map((blog) => {
    const articleUrl = new URL(`/blog/${encodeURIComponent(String(blog._id))}`, siteUrl).href
    const date = getDate(blog.createdAt)
    const categories = [...new Set([blog.category, ...(blog.tags || [])].filter(Boolean))]

    return `    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="false">urn:blog:${escapeXml(blog._id)}</guid>
      ${date ? `<pubDate>${date.toUTCString()}</pubDate>` : ''}
      ${categories.map(category => `<category>${escapeXml(category)}</category>`).join('\n      ')}
      <description>${escapeXml(renderOverview(blog, articleUrl, date))}</description>
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${FEED_TITLE}</title>
    <link>${escapeXml(new URL('/blog', siteUrl).href)}</link>
    <description>${FEED_DESCRIPTION}</description>
    <language>zh-CN</language>
    <ttl>5</ttl>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}

module.exports = { createRssFeed }
