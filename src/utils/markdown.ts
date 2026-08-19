import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

/**
 * Markdown 渲染（配置与 shanxi 大模型系统一致：GFM + 换行 + 表格 + 代码高亮 github 主题）。
 * 供聊天消息渲染使用。
 */
const marked = new Marked(
  {
    gfm: true, // GFM 已内置表格支持（marked 18 无独立 tables 选项）
    breaks: true,
  },
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
      } catch {
        return code
      }
    },
  }),
)

export function renderMarkdown(text?: string): string {
  if (!text) return ''
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    // 解析失败时降级为纯文本（转义 HTML，避免注入）
    return escapeHtml(text)
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
