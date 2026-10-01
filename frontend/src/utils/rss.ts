export const getRssFeedUrl = (): string => new URL('/rss.xml', window.location.origin).href
