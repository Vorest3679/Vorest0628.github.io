const express = require('express')
const Blog = require('../models/Blog')
const { ApiError } = require('../utils/error')
const { createRssFeed } = require('../utils/rss')

const router = express.Router()

// 公开订阅接口，始终排除草稿；排序不受文章置顶优先级影响。
router.get('/rss.xml', async (req, res, next) => {
  try {
    const forwardedProtocol = req.get('x-forwarded-proto')?.split(',')[0].trim()
    const protocol = ['http', 'https'].includes(forwardedProtocol) ? forwardedProtocol : req.protocol
    const requestOrigin = `${protocol}://${req.get('host')}`
    let siteUrl
    try {
      const url = new URL(process.env.SITE_URL?.trim() || requestOrigin)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('Invalid site URL')
      }
      siteUrl = url.origin
    } catch {
      throw new ApiError(503, 'RSS 网站地址配置无效，请将 SITE_URL 设置为网站的完整 HTTP(S) 地址。')
    }

    const blogs = await Blog.find({ status: { $in: ['published', 'pinned'] } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .select('title excerpt category tags createdAt')
      .lean()

    // 订阅源的自引用链接使用公开地址，代理负责转发到 /api/rss.xml。
    const feedUrl = new URL('/rss.xml', siteUrl).href
    const xml = createRssFeed(blogs, { siteUrl, feedUrl })

    res.set('Content-Type', 'application/rss+xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=300')
    res.send(xml)
  } catch (error) {
    next(error)
  }
})

module.exports = router
