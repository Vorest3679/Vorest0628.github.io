import { Marked, Renderer, type MarkedOptions } from 'marked'
import markedKatex from 'marked-katex-extension'
import katex from 'katex'

// Accept a single backslash between equations in pasted cases environments.
// Keep ordinary LaTeX spacing commands and existing \\ row separators intact.
const normalizeCasesRows = (latex: string): string => (
  latex.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_environment, body) => {
    const parts = body.split(/((?<!\\)\\\s+)/)
    for (let index = 1; index < parts.length; index += 2) {
      const previousRow = parts[index - 1].split(/\\\\/).pop() || ''
      const nextRow = parts[index + 1].split(/\\\\/)[0]
      if (previousRow.includes('=') && nextRow.includes('=')) {
        parts[index] = `\\\\${parts[index].slice(1)}`
      }
    }
    return `\\begin{cases}${parts.join('')}\\end{cases}`
  })
)

// Capture display math before Markdown can consume its backslashes or line breaks.
const DISPLAY_MATH_RULE = /^\$\$(?!\$)((?:\\[\s\S]|[^\\])+?)\$\$(?!\$)/
const BLOCK_DISPLAY_MATH_RULE = /^ {0,3}\$\$(?!\$)((?:\\[\s\S]|[^\\])+?)\$\$(?!\$)[ \t]*(?:\n|$)/

const IMAGE_FILE_EXTENSION_REGEX = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i

const wrapMarkdownDestination = (destination = ''): string => {
  if (!destination || /^<.*>$/.test(destination) || !/\s/.test(destination)) {
    return destination
  }

  return `<${destination}>`
}

const shouldTreatAsWikiImage = (destination = ''): boolean => {
  const normalized = String(destination).split('#')[0].split('?')[0]
  return IMAGE_FILE_EXTENSION_REGEX.test(normalized)
}

const escapeMarkdownAltText = (altText = ''): string => (
  String(altText).replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
)

const normalizeWikiImageEmbeds = (markdown = ''): string => {
  return String(markdown).replace(/!\[\[([^\]\n]+)\]\]/g, (match, inner) => {
    const [rawDestination = '', ...rawMeta] = String(inner).split('|')
    const destination = rawDestination.trim()
    if (!destination || !shouldTreatAsWikiImage(destination)) return match

    const wikiLabel = rawMeta.join('|').trim()
    const altText = wikiLabel && !/^\d+(?:x\d+)?$/i.test(wikiLabel) ? wikiLabel : ''

    return `![${escapeMarkdownAltText(altText)}](${wrapMarkdownDestination(destination)})`
  })
}

export const normalizeMarkdownImageDestinations = (markdown = ''): string => {
  return normalizeWikiImageEmbeds(markdown).replace(/!\[([^\]]*)\]\((?!<)([^)\n]+)\)/g, (match, altText, inner) => {
    const value = String(inner || '').trim()
    if (!value) return match

    const titleMatch = value.match(/^(.*?)(\s+"[^"]*")$/)
    const destination = (titleMatch ? titleMatch[1] : value).trim()
    const titleSuffix = titleMatch ? titleMatch[2] : ''

    if (!destination) {
      return match
    }

    return `![${altText}](${wrapMarkdownDestination(destination)}${titleSuffix})`
  })
}

export const createMarkdownRenderer = (options: MarkedOptions = {}): Marked => {
  const renderer = new Marked()
  renderer.setOptions({
    gfm: true,
    breaks: false,
    ...options
  })
  const renderTable = options.renderer?.table || Renderer.prototype.table
  renderer.use({
    renderer: {
      table(token) {
        return `<div class="markdown-table-wrapper">${renderTable.call(this, token)}</div>\n`
      }
    }
  })
  const mathOptions = {
    throwOnError: false,
    nonStandard: true,
    strict: false
  }
  const mathExtension = markedKatex(mathOptions)
  // Apply compatibility only to math tokens, leaving code and prose untouched.
  for (const extension of mathExtension.extensions || []) {
    if (!extension.renderer) continue
    const renderMath = extension.renderer
    extension.renderer = function (token) {
      return renderMath.call(this, { ...token, text: normalizeCasesRows(token.text) })
    }
  }
  renderer.use(mathExtension)
  renderer.use({
    extensions: [
      {
        name: 'displayKatex',
        level: 'block',
        start(src) {
          return src.match(/^ {0,3}\$\$(?!\$)/m)?.index
        },
        tokenizer(src) {
          const match = src.match(BLOCK_DISPLAY_MATH_RULE)
          if (match) return { type: 'displayKatex', raw: match[0], text: match[1].trim() }
        },
        renderer(token) {
          return katex.renderToString(normalizeCasesRows(token.text), { ...mathOptions, displayMode: true }) + '\n'
        }
      },
      {
        name: 'displayKatex',
        level: 'inline',
        start(src) {
          const index = src.indexOf('$$')
          return index === -1 ? undefined : index
        },
        tokenizer(src) {
          const match = src.match(DISPLAY_MATH_RULE)
          if (match) return { type: 'displayKatex', raw: match[0], text: match[1].trim() }
        },
        renderer(token) {
          return katex.renderToString(normalizeCasesRows(token.text), { ...mathOptions, displayMode: true })
        }
      }
    ]
  })

  return renderer
}
