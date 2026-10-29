// 把 three + lib + world + main 内联成单个 html
// 输出 index.html（线上根入口，静态托管下子资源会被鉴权拦截，必须全内联）
// 同时输出 rainy-mart.html（同内容，方便单独拷走双击打开）
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function stripImports(src) {
  const out = [];
  let skipping = false;
  for (const line of src.split('\n')) {
    if (!skipping && /^import\s/.test(line)) {
      if (/from\s+['"][^'"]+['"]\s*;?\s*$/.test(line)) continue; // 单行 import
      skipping = true;
      continue;
    }
    if (skipping) {
      if (/from\s+['"][^'"]+['"]\s*;?\s*$/.test(line)) skipping = false;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/* ---------- three：去掉 export，改成 THREE 命名空间 ---------- */
let three = read('vendor/three.module.js');
const m = three.match(/\nexport \{([\s\S]*?)\};\s*$/);
if (!m) throw new Error('未找到 three 的 export 语句');
const names = m[1].split(',').map((s) => s.trim()).filter(Boolean);
three = three.slice(0, m.index);
const threeNs = `\nconst THREE = { ${names.join(', ')} };\n`;

/* ---------- lib / world / main ---------- */
let lib = stripImports(read('js/lib.js'));
let world = stripImports(read('js/world.js'));
let main = stripImports(read('js/main.js'));

const deExport = (s) => s.replace(/^export (const|let|var|function|class) /gm, '$1 ');
lib = deExport(lib);
world = deExport(world);
main = deExport(main);

const bundle = [
  three,
  threeNs,
  '(function () {',
  lib,
  world,
  main,
  '})();',
].join('\n');

const inlineTag = '<script type="module">\n' + bundle + '\n</script>';
const html = read('src.html')
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
  .replace(/<script type="module" src="\.\/js\/main\.js"><\/script>/, () => inlineTag);

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'rainy-mart.html'), html);
console.log('built index.html + rainy-mart.html', (html.length / 1024).toFixed(0) + ' KB');
