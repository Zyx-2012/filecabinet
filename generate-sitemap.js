const fs = require('fs')
const path = require('path')

const IGNORE_LIST = [
  'node_modules',
  '.git',
  '.netlify',
  'netlify.toml',
  '.gitignore',
  'package.json',
  'package-lock.json',
  'generate-sitemap.js',
  'sitemap.json',
  'encrypted',
  'README.md'
]

const FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],
  videos: ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  scripts: ['.js', '.jsx', '.ts', '.tsx'],
  styles: ['.css', '.scss', '.sass', '.less'],
  html: ['.html', '.htm'],
  archives: ['.zip', '.rar', '.tar', '.gz'],
  data: ['.json', '.xml', '.csv', '.yml', '.yaml'],
  fonts: ['.ttf', '.otf', '.woff', '.woff2']
}

function getFileType(extension) {
  for (const [type, exts] of Object.entries(FILE_TYPES)) {
    if (exts.includes(extension.toLowerCase())) return type
  }
  return 'other'
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function scanDirectory(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath)
  const result = []
  for (const item of items) {
    if (IGNORE_LIST.includes(item)) continue
    const fullPath = path.join(dirPath, item)
    const relPath = path.join(relativePath, item)
    const stats = fs.statSync(fullPath)
    const posixPath = toPosix(relPath)
    const info = {
      name: item,
      path: posixPath,
      url: '/' + posixPath,
      lm: stats.mtime.toISOString()
    }
    if (stats.isDirectory()) {
      info.type = 'directory'
      info.children = scanDirectory(fullPath, relPath)
      info.fc = countFiles(info.children)
      info.dsz = sumBytes(info.children)
    } else {
      const ext = path.extname(item)
      info.type = 'file'
      info.ext = ext || 'none'
      info.ft = getFileType(ext)
      info.sz = stats.size
    }
    result.push(info)
  }
  return result.sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1
    if (a.type !== 'directory' && b.type === 'directory') return 1
    return a.name.localeCompare(b.name)
  })
}

function countFiles(items) {
  let count = 0
  for (const item of items) {
    if (item.type === 'file') count++
    else if (item.type === 'directory') count += countFiles(item.children)
  }
  return count
}

function sumBytes(items){
  let total=0
  for(const it of items){
    if(it.type==='file') total+= (it.sz||0)
    else if(it.type==='directory') total+= sumBytes(it.children||[])
  }
  return total
}


function generateSitemap() {
  const rootPath = process.cwd()
  const assetsRoot = path.join(rootPath, 'public')
  const siteData = {
    generatedAt: new Date().toISOString(),
    rootPath,
    items: fs.existsSync(assetsRoot) ? scanDirectory(assetsRoot) : [],
    sum: {
      dirs: 0,
      files: 0,
      size: 0,
      by: {}
    }
  }
  ;(function calc(items){
    for (const item of items) {
      if (item.type === 'directory') {
        siteData.sum.dirs++
        calc(item.children)
      } else {
        siteData.sum.files++
        siteData.sum.size += item.sz || 0
        const t = item.ft || 'other'
        siteData.sum.by[t] = (siteData.sum.by[t] || 0) + 1
      }
    }
  })(siteData.items)
  siteData.sum.sizef = formatBytes(siteData.sum.size)
  fs.writeFileSync(path.join(rootPath, 'sitemap.json'), JSON.stringify(siteData, null, 2))
}

generateSitemap()