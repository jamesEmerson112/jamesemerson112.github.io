import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import {
  POSTS_DIR,
  buildBlogIndex,
  listDraftSlugs,
  readBlogPosts,
  renderBlogFeed
} from './scripts/build-blog-index.js'

/* Blog authoring support.
   - Dev: /blog/index.json is generated on request (drafts included and
     flagged), and saving a post pushes a `blog:changed` event so the open
     page refreshes in place.
   - Build: public/blog/index.json is regenerated before bundling (it can't
     go stale), draft posts are removed from the output so they never ship,
     and an RSS feed is written to dist/blog/feed.xml.
   The feed is served on the fly in dev too. */
function blogPlugin() {
  const postsDir = path.normalize(POSTS_DIR)
  const slugFromFile = (file) => {
    const normalized = path.normalize(file)
    if (!normalized.startsWith(postsDir) || !normalized.endsWith('.md')) return null
    return path.basename(normalized, '.md')
  }

  let outDir = 'dist'

  return [
    {
      name: 'blog:dev-index',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0]
          if (url === '/blog/index.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify(readBlogPosts({ includeDrafts: true }), null, 2))
            return
          }
          if (url === '/blog/feed.xml') {
            res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(renderBlogFeed())
            return
          }
          next()
        })

        const notify = (file) => {
          const slug = slugFromFile(file)
          if (slug) server.ws.send({ type: 'custom', event: 'blog:changed', data: { slug } })
        }
        server.watcher.add(postsDir)
        server.watcher.on('add', notify)
        server.watcher.on('change', notify)
        server.watcher.on('unlink', notify)
      }
    },
    {
      name: 'blog:build-index',
      apply: 'build',
      configResolved(config) {
        outDir = path.resolve(config.root, config.build.outDir)
      },
      buildStart() {
        buildBlogIndex()
      },
      closeBundle() {
        for (const slug of listDraftSlugs()) {
          const draftFile = path.join(outDir, 'blog', 'posts', `${slug}.md`)
          if (fs.existsSync(draftFile)) fs.rmSync(draftFile)
        }
        const feedDir = path.join(outDir, 'blog')
        fs.mkdirSync(feedDir, { recursive: true })
        fs.writeFileSync(path.join(feedDir, 'feed.xml'), renderBlogFeed())
      }
    }
  ]
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [svelte(), blogPlugin()],
  // Root path for GitHub Pages user site
  base: '/',
  build: {
    outDir: 'dist'
  }
}))
