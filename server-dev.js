const http=require('http')
const fs=require('fs')
const path=require('path')

const ROOT=__dirname
const PUBLIC=path.join(ROOT,'public')

const MIME={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css',
  '.js':'application/javascript',
  '.json':'application/json',
  '.txt':'text/plain; charset=utf-8',
  '.md':'text/plain; charset=utf-8',
  '.yml':'text/plain; charset=utf-8',
  '.yaml':'text/plain; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.bmp':'image/bmp',
  '.ico':'image/x-icon',
  '.ttf':'font/ttf',
  '.otf':'font/otf',
  '.woff':'font/woff',
  '.woff2':'font/woff2'
}

function send(res,status,body,headers={}){
  res.writeHead(status,{ 'Cache-Control':'no-store', ...headers })
  res.end(body)
}

function serveFile(fp,res){
  try{
    const st=fs.statSync(fp)
    if(st.isDirectory()){
      // no directory listing; return 404
      return send(res,404,'Not Found',{'Content-Type':'text/plain'})
    }
    const ext=path.extname(fp)
    const mime=MIME[ext]||'application/octet-stream'
    const stream=fs.createReadStream(fp)
    res.writeHead(200,{ 'Content-Type': mime, 'Cache-Control':'no-store' })
    stream.pipe(res)
  }catch(err){
    send(res,404,'Not Found',{'Content-Type':'text/plain'})
  }
}

function serveFileWithType(fp,res,mime){
  try{
    const st=fs.statSync(fp)
    if(st.isDirectory()){
      return send(res,404,'Not Found',{'Content-Type':'text/plain'})
    }
    const stream=fs.createReadStream(fp)
    res.writeHead(200,{ 'Content-Type': mime, 'Cache-Control':'no-store' })
    stream.pipe(res)
  }catch(err){
    send(res,404,'Not Found',{'Content-Type':'text/plain'})
  }
}

function fontPreviewHTML(pathname){
  const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const src=pathname
  const name=src.split('/').pop()
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>字体预览 - ${esc(name)}</title><style>*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#0b1220;--fg:#e2e8f0;--panel:#0f172a;--border:#1f2937;--accent:#60a5fa}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--fg);line-height:1.6}.wrap{max-width:900px;margin:0 auto;padding:2rem}.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}.title{font-size:1.25rem;color:var(--accent)}.panel{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:1rem}.row{display:flex;gap:1rem;align-items:center}.row input[type=text]{flex:1;padding:.6rem .8rem;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--fg)}.row input[type=range]{flex:1}.sample{padding:2rem 1.5rem;background:var(--panel);border:1px dashed var(--border);border-radius:10px;text-align:center;word-break:break-word;font-family:'PreviewFont'}.actions{display:flex;gap:.75rem;margin:.5rem 0 1rem}.btn{padding:.5rem 1rem;border:2px solid #1f2937;border-radius:6px;background:#0f172a;color:#e2e8f0;cursor:pointer;display:inline-flex;align-items:center;gap:.5rem}.btn:hover{transform:translateY(-1px)}.meta{margin-top:.5rem;color:#9ca3af;font-size:.9rem}.meta a{color:#9ca3af;text-decoration:none;border-bottom:1px dashed #9ca3af;cursor:pointer}.meta a:hover{color:#fff;border-color:#fff}.toast{position:fixed;right:20px;bottom:20px;background:#10b981;color:#fff;padding:.5rem .75rem;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,.2);opacity:0;transform:translateY(10px);} .toast.show{opacity:1;transform:translateY(0);transition:all .25s ease}@font-face{font-family:'PreviewFont';src:url('${esc(src)}') format('${name.endsWith('.woff2')?'woff2':name.endsWith('.woff')?'woff':name.endsWith('.otf')?'opentype':'truetype'}');font-display:block}</style></head><body><div class="wrap"><div class="header"><div class="title">字体预览</div><a class="back" href="/index.html" style="color:#9ca3af;text-decoration:none">返回首页</a></div><div class="panel"><div class="row" style="margin-bottom:.75rem"><input id="text" type="text" placeholder="输入要预览的文字" value="The quick brown fox jumps over the lazy dog 1234567890 你好，世界！"></div><div class="row"><span style="min-width:90px">字体大小</span><input id="size" type="range" min="12" max="160" value="48"><span id="size-val" style="min-width:60px;text-align:right">48px</span></div><div class="actions"><button id="download" class="btn"><i class="fas fa-download"></i><span>下载字体</span></button></div></div><div class="sample" id="sample">示例文本</div><div class="meta" id="meta"></div></div><script>(function(){const src='${esc(src)}';const fam='PreviewFont';const sample=document.getElementById('sample');const input=document.getElementById('text');const size=document.getElementById('size');const sizeVal=document.getElementById('size-val');sample.textContent=input.value;sizeVal.textContent=size.value+'px';sample.style.fontSize=size.value+'px';input.addEventListener('input',function(){sample.textContent=input.value});size.addEventListener('input',function(){sizeVal.textContent=size.value+'px';sample.style.fontSize=size.value+'px'});const abs=location.origin+src;const meta=document.getElementById('meta');meta.innerHTML='源文件: <a id="src-link" href="'+abs+'">'+abs+'</a>';const link=document.getElementById('src-link');link.addEventListener('click',function(e){e.preventDefault();navigator.clipboard.writeText(abs).then(function(){const t=document.createElement('div');t.className='toast';t.textContent='Copied!';document.body.appendChild(t);setTimeout(function(){t.classList.add('show')},10);setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove()},250)},1500);});});const dl=document.getElementById('download');dl.addEventListener('click',function(){dl.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:450,easing:'cubic-bezier(.28,.84,.42,1)'});const a=document.createElement('a');a.href=src;a.download='${esc(name)}';document.body.appendChild(a);a.click();a.remove();});})();</script></body></html>`
}

const server=http.createServer((req,res)=>{
  try{
    const u=new URL(req.url, 'http://localhost')
    let p=u.pathname
    if(p==='/') return serveFile(path.join(ROOT,'index.html'),res)
    if(p==='/sitemap.json') return serveFile(path.join(ROOT,'sitemap.json'),res)
    if(p==='/sw.js') return serveFile(path.join(ROOT,'sw.js'),res)
    if(p==='/sw2.js') return serveFile(path.join(ROOT,'sw2.js'),res)
    if(p==='/font-preview.html'){
      const src=u.searchParams.get('src')||''
      if(/\.(ttf|otf|woff2?)$/i.test(src)){
        return send(res,200,fontPreviewHTML(src),{'Content-Type':'text/html; charset=utf-8'})
      }
      return serveFile(path.join(ROOT,'font-preview.html'),res)
    }
    const accept=req.headers['accept']||''
    const rel=p.replace(/^\/+/,'')
    const pubFull=path.join(PUBLIC,rel)
    // do not intercept fonts on server; service worker handles preview
    if(fs.existsSync(pubFull)){
      const ext=path.extname(pubFull).toLowerCase()
      if(ext==='.html'||ext==='.htm'){
        return serveFileWithType(pubFull,res,'text/plain; charset=utf-8')
      }
      return serveFile(pubFull,res)
    }
    return serveFile(path.join(ROOT,rel),res)
  }catch(e){
    send(res,500,'Server Error',{'Content-Type':'text/plain'})
  }
})

const PORT=5500
server.listen(PORT,'127.0.0.1',()=>{
  console.log('Dev server on http://127.0.0.1:'+PORT)
})