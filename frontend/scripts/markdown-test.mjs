import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Renderer } from 'marked'
import { build } from 'vite'

// Load the actual TypeScript utility without starting a development server.
const bundled = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('../src/utils/markdown.ts', import.meta.url)),
      formats: ['es']
    }
  }
})
const bundle = Array.isArray(bundled) ? bundled[0] : bundled
const moduleCode = bundle.output.find((item) => item.type === 'chunk').code
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'markdown-test-'))
let createMarkdownRenderer
try {
  const modulePath = join(temporaryDirectory, 'markdown.mjs')
  await writeFile(modulePath, moduleCode)
  ;({ createMarkdownRenderer } = await import(pathToFileURL(modulePath).href))
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
const renderer = createMarkdownRenderer()
const parse = (markdown) => renderer.parse(markdown, { async: false })
const assertMath = (markdown, rows) => {
  const html = parse(markdown)
  assert.match(html, /class="katex-display"/)
  assert.doesNotMatch(html, /class="katex-error"/)
  if (rows) assert.equal((html.match(/<mtr>/g) || []).length, rows)
  return html
}

// The exact pasted example must produce three equations rather than one row.
assertMath(String.raw`$$\begin{cases} x_1 + x_2 + x_3 = -a \ x_1 x_2 + x_1 x_3 + x_2 x_3 = b \ x_1 x_2 x_3 = -c \end{cases}$$`, 3)
assertMath(String.raw`$$\begin{cases} x+y=1 \\ x-y=2 \end{cases}$$`, 2)
assertMath(String.raw`$$\begin{cases}
x+y=1 \\
x-y=2
\end{cases}$$`, 2)
assertMath(String.raw`$$
\begin{cases}
x+y=1 \\
x-y=2
\end{cases}
$$`, 2)
assertMath(String.raw`前文 $$\begin{aligned}
x+y&=1 \\
x-y&=2
\end{aligned}$$ 后文`, 2)
assertMath(String.raw`$$\begin{pmatrix}
1 & 2 \\
3 & 4
\end{pmatrix}$$`, 2)
const adjacent = parse('前文\n\n$$x^2$$\n\n$$y^2$$\n\n后文')
assert.equal((adjacent.match(/class="katex-display"/g) || []).length, 2)
assert.match(adjacent, /<p>前文<\/p>/)
assert.match(adjacent, /<p>后文<\/p>/)

// Compatibility must not change valid LaTeX spacing or Markdown code examples.
assertMath(String.raw`$$\begin{cases} a\ b=1 \\ c=2 \end{cases}$$`, 2)
assertMath(String.raw`$$\begin{cases} x=1\ y \\ z=2 \end{cases}$$`, 2)
assert.match(parse('行内 $x_1 + x_2$ 公式'), /class="katex"/)
const code = String.raw`$$\begin{cases} x=1 \ y=2 \end{cases}$$`
for (const markdown of ['`' + code + '`', '```latex\n' + code + '\n```', '    ' + code]) {
  const html = parse(markdown)
  assert.match(html, /<code/)
  assert.doesNotMatch(html, /class="katex/)
}
assert.doesNotMatch(parse(String.raw`\$\$x=1\$\$`), /class="katex/)
assert.doesNotMatch(parse('$$unclosed'), /class="katex/)
assert.match(parse(String.raw`$$\begin{cases}x=1$$`), /class="katex-error"/)

const imageRenderer = new Renderer()
imageRenderer.image = () => '<img data-custom="yes">'
const custom = createMarkdownRenderer({ renderer: imageRenderer })
assert.match(custom.parse('![image](test.png)', { async: false }), /data-custom="yes"/)

const table = `| 安全级别 | RSA 密钥长度 | ECC 密钥长度 |
|---------|-------------|-------------|
| 128 位 | 3072 位 | 256 位 |
| 256 位 | 15360 位 | 512 位 |`
const assertTable = (html) => {
  assert.match(html, /<div class="markdown-table-wrapper"><table>/)
  assert.equal((html.match(/<th>/g) || []).length, 3)
  assert.equal((html.match(/<td>/g) || []).length, 6)
  assert.match(html, /<td>15360 位<\/td>/)
}
assertTable(parse(table))
assertTable(custom.parse(table, { async: false }))
assertTable(parse(`正文\n\n${table}\n\n$$x^2$$`))
const alignedTable = parse('| 左 | 中 | 右 |\n| :--- | :---: | ---: |\n| $x_1$ | **粗体** | 3 |')
for (const align of ['left', 'center', 'right']) {
  assert.match(alignedTable, new RegExp(`<th align="${align}">`))
}
assert.match(alignedTable, /class="katex"/)
assert.match(alignedTable, /<strong>粗体<\/strong>/)
assert.doesNotMatch(parse('```markdown\n' + table + '\n```'), /markdown-table-wrapper/)
console.log('Markdown math and table regression checks passed.')
