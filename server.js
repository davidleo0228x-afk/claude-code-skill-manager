const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const AGENTS_DIR = path.join(os.homedir(), '.agents', 'skills');
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'skills');
const PORT = 3099;

// ─── Category & Metadata Mappings ───────────────────────────────────────────

const CATEGORIES = {
  'frontend-design':              { cat: '🎨 设计 / UI', emoji: '🎨' },
  'ui-ux-pro-max':                { cat: '🎨 设计 / UI', emoji: '🎨' },
  'design-taste-frontend':        { cat: '🎨 设计 / UI', emoji: '🎨' },
  'design-with-taste':            { cat: '🎨 设计 / UI', emoji: '🎨' },
  'emil-design-eng':              { cat: '🎨 设计 / UI', emoji: '🎨' },
  'web-design-guidelines':        { cat: '🎨 设计 / UI', emoji: '🎨' },
  'gsap-framer-scroll-animation': { cat: '✨ 动效 / 动画', emoji: '✨' },
  'locomotive-scroll':            { cat: '✨ 动效 / 动画', emoji: '✨' },
  'web-motion-design':            { cat: '✨ 动效 / 动画', emoji: '✨' },
  'vercel-react-view-transitions':{ cat: '✨ 动效 / 动画', emoji: '✨' },
  'vercel-composition-patterns':  { cat: '✨ 动效 / 动画', emoji: '✨' },
  'slidev':                       { cat: '📊 PPT / 演示', emoji: '📊' },
  'html-ppt':                     { cat: '📊 PPT / 演示', emoji: '📊' },
  'html-to-ppt':                  { cat: '📊 PPT / 演示', emoji: '📊' },
  'pptx':                         { cat: '📊 PPT / 演示', emoji: '📊' },
  'frontend-slides':              { cat: '📊 PPT / 演示', emoji: '📊' },
  'presentation-deck':            { cat: '📊 PPT / 演示', emoji: '📊' },
  'elite-powerpoint-designer':    { cat: '📊 PPT / 演示', emoji: '📊' },
  'marp-slide':                   { cat: '📊 PPT / 演示', emoji: '📊' },
  'pitch-deck':                   { cat: '📊 PPT / 演示', emoji: '📊' },
  'vercel-react-best-practices':  { cat: '⚛️ React 前端', emoji: '⚛️' },
  'vercel-react-native-skills':   { cat: '⚛️ React 前端', emoji: '⚛️' },
  'deploy-to-vercel':             { cat: '🚀 部署 / 运维', emoji: '🚀' },
  'vercel-cli-with-tokens':       { cat: '🚀 部署 / 运维', emoji: '🚀' },
  'vercel-optimize':              { cat: '🚀 部署 / 运维', emoji: '🚀' },
  'find-skills':                  { cat: '🔧 工具 / 写作', emoji: '🔧' },
  'writing-guidelines':           { cat: '🔧 工具 / 写作', emoji: '🔧' },
};

const SUITABLE_PROJECTS = {
  'frontend-design':              ['网页设计', 'UI 重构', '品牌页面', '前端开发'],
  'ui-ux-pro-max':                ['网站', '落地页', 'Dashboard', 'SaaS', '作品集', '博客', '电商', '管理后台'],
  'design-taste-frontend':        ['落地页', '作品集', '品牌重设计', '高端网站'],
  'design-with-taste':            ['UI 打磨', '品牌设计', '高端网页', '交互体验'],
  'emil-design-eng':              ['UI 组件', '交互打磨', '设计工程', '产品体验'],
  'web-design-guidelines':        ['设计审查', '无障碍审计', 'UX 评审', '前端项目'],
  'gsap-framer-scroll-animation': ['滚动动画', '视差网站', '交互式页面', '品牌官网'],
  'locomotive-scroll':            ['平滑滚动', '视差网站', '品牌页面', '创意网站'],
  'web-motion-design':            ['CSS 动画', 'UI 动效', '交互设计', 'Web 应用'],
  'vercel-react-view-transitions':['React 应用', '页面过渡', 'SPA', '移动端 Web'],
  'vercel-composition-patterns':  ['React 组件库', '代码重构', '前端架构', '设计系统'],
  'slidev':                       ['技术分享', '开发者演讲', '代码演示', '教学课件'],
  'html-ppt':                     ['产品发布', 'HTML 幻灯片', '小红书图文', '演讲'],
  'html-to-ppt':                  ['格式转换', 'Markdown 转 PPT', '文档转换'],
  'pptx':                         ['PPTX 文件处理', '演示文稿', '幻灯片', '报告'],
  'frontend-slides':              ['网页幻灯片', 'PPT 转 Web', '动画演示', '演讲'],
  'presentation-deck':            ['设计评审', '设计展示', '利益相关者演示', '项目汇报'],
  'elite-powerpoint-designer':    ['高级 PPT', '品牌演示', '发布会级别', '商业提案'],
  'marp-slide':                   ['Markdown 幻灯片', '技术文档', '项目周报', '快速演示'],
  'pitch-deck':                   ['融资演示', '商业计划书', 'VC 路演', '创业 BP'],
  'vercel-react-best-practices':  ['React 优化', 'Next.js 性能', '前端重构', 'Web 应用'],
  'vercel-react-native-skills':   ['React Native', 'Expo', '移动端优化', 'App 开发'],
  'deploy-to-vercel':             ['静态网站', 'Next.js', '前端部署', '全栈应用'],
  'vercel-cli-with-tokens':       ['Vercel 管理', '环境变量', 'CI/CD', '团队协作'],
  'vercel-optimize':              ['成本优化', '性能审计', 'Vercel 分析', 'Web 性能'],
  'find-skills':                  ['技能发现', 'Skill 管理', '能力扩展'],
  'writing-guidelines':           ['文档审查', '文案风格', '技术写作', '内容创作'],
};

const TRIGGER_KEYWORDS = {
  'frontend-design':              ['设计前端', '美化界面', 'UI design', 'aesthetic', 'typography', '前端设计', '品牌风格'],
  'ui-ux-pro-max':                ['设计', 'UI', 'UX', 'landing page', '作品集', 'portfolio', 'dashboard', 'SaaS', '配色', '字体配对'],
  'design-taste-frontend':        ['redesign', '重新设计', '高端设计', 'landing page', 'portfolio', '反模板'],
  'design-with-taste':            ['有品位的设计', '精致的 UI', 'crafted design', '灵动界面', '设计哲学', '质感'],
  'emil-design-eng':              ['UI polish', '组件设计', '动效品味', '设计工程', '细节打磨', '交互打磨'],
  'web-design-guidelines':        ['审查 UI', 'accessibility', 'audit design', 'review UX', '检查设计', '无障碍'],
  'gsap-framer-scroll-animation': ['滚动动画', 'parallax', 'animate on scroll', 'fade in scroll', 'scroll like Apple', 'GSAP', 'Framer Motion'],
  'locomotive-scroll':            ['smooth scrolling', 'locomotive scroll', '视差滚动', 'parallax', 'sticky elements', '惯性滚动'],
  'web-motion-design':            ['CSS animation', 'transition', 'browser animation', '动效', '关键帧', '动画原则'],
  'vercel-react-view-transitions':['view transitions', 'page transition', 'route animation', '共享元素动画', '页面过渡'],
  'vercel-composition-patterns':  ['component architecture', 'compound components', 'render props', '组件架构', '重构组件'],
  'slidev':                       ['技术分享', 'conference talk', 'code slides', '开发者演示', 'code walkthrough', 'Slidev'],
  'html-ppt':                     ['PPT', 'slides', '幻灯片', 'deck', '演讲稿', '分享稿', '小红书图文', 'presentation'],
  'html-to-ppt':                  ['convert to PPT', 'HTML 转 PPT', 'Marp', '转换为演示文稿', '格式转换'],
  'pptx':                         ['pptx', 'deck', 'presentation', '.pptx 文件', 'PowerPoint', '演示文稿'],
  'frontend-slides':              ['presentation', 'convert PPT', 'animate slides', 'web slides', '网页幻灯片'],
  'presentation-deck':            ['design presentation', 'stakeholder deck', '设计展示', '设计评审', '演示结构'],
  'elite-powerpoint-designer':    ['professional presentation', 'slide deck', 'pitch', '精美 PPT', '高级演示', '发布会'],
  'marp-slide':                   ['Marp', 'Markdown slides', 'slide creation', '做个幻灯片', '快速演示'],
  'pitch-deck':                   ['investor pitch', '融资演示', 'BP 演示', 'pitch deck', '商业计划书', 'VC'],
  'vercel-react-best-practices':  ['React performance', 'refactor', 'Next.js optimization', '优化性能', 'React 最佳实践'],
  'vercel-react-native-skills':   ['React Native', 'Expo', 'mobile performance', '原生模块', 'FlatList'],
  'deploy-to-vercel':             ['deploy', '部署', 'push live', 'preview deployment', '发布', '上线'],
  'vercel-cli-with-tokens':       ['set up vercel', 'add env vars', 'vercel token', '配置环境变量', 'Vercel CLI'],
  'vercel-optimize':              ['Vercel bill', 'cost optimization', 'slow route', 'caching', 'Core Web Vitals', '成本优化'],
  'find-skills':                  ['find a skill', '有没有 XX 相关的 skill', '帮我找 XX 的 skill', '搜索技能', '安装 skill'],
  'writing-guidelines':           ['review my docs', 'check writing style', 'audit prose', '审查文档风格', '写作风格'],
};

const ZH_DESCRIPTIONS = {
  'frontend-design':              'Anthropic 官方前端设计指南。帮助打造独特、有意图的视觉设计，包括美学方向、字体排版，避免模板化的默认外观。',
  'ui-ux-pro-max':                '全能 UI/UX 设计智能引擎。内含 50+ 风格、161 配色方案、57 字体配对、99 UX 准则、25 图表类型，覆盖 React/Next.js/Vue/Tailwind/shadcn/ui 等 10 个技术栈。',
  'design-taste-frontend':        '反模板化前端设计技能。专攻落地页、作品集和品牌重设计。从需求中推断正确的设计方向，交付不模板化的界面。',
  'design-with-taste':            '将"家庭价值观"设计哲学应用于 UI：简约（渐进展示）、流动（无缝过渡）、愉悦（选择性强调）。让每个界面都感觉精心打磨、有意图、有生命力。',
  'emil-design-eng':              'Emil Kowalski 的 UI 打磨哲学——组件设计、动画决策、让软件感觉"对"的隐性细节。Emil 是 Vercel 设计工程师，以动效品味著称。',
  'web-design-guidelines':        'Web 界面设计审查。检查 UI 是否符合最佳实践，包括无障碍审计、UX 评审，确保设计质量。',
  'gsap-framer-scroll-animation': '滚动动画全能工具。覆盖 GSAP ScrollTrigger（pin、scrub、snap、timeline、水平滚动）和 Framer Motion / Motion v12（useScroll、useTransform、whileInView）。支持 Vanilla JS、React、Next.js。',
  'locomotive-scroll':            'Locomotive Scroll 平滑滚动库完整指南。视差效果、viewport 检测、滚动触发动画、惯性滚动。可与 GSAP ScrollTrigger 联动。',
  'web-motion-design':            '将迪士尼 12 条动画原则应用于 CSS、JavaScript、React/Vue Motion 等浏览器动画，打造富有生命力的动效。',
  'vercel-react-view-transitions': '使用 React View Transitions API 实现流畅的原生级页面过渡动画——路由动画、共享元素动画、组件进出动画、列表重排动画。',
  'vercel-composition-patterns':  'React 组合模式指南。适用于组件重构、构建灵活组件库、设计可复用 API。包含 React 19 API 变化。',
  'slidev':                       '开发者专用网页幻灯片工具。基于 Vite + Vue + Markdown，支持代码高亮、动画、交互功能。适合技术分享、会议演讲、教学课件。',
  'html-ppt':                     'HTML PPT Studio —— 模板驱动的专业静态 HTML 幻灯片，多种风格、布局和动画。支持键盘导航，也可生成小红书图文。',
  'html-to-ppt':                  '将 HTML/Markdown 转换为 PowerPoint 演示文稿，基于 Marp 引擎。适合格式转换场景。',
  'pptx':                         'PPTX 文件全能操作。创建、读取、编辑、合并 .pptx 文件，支持模板、布局、演讲者备注和批注。',
  'frontend-slides':              '创建惊艳、动画丰富的 HTML 演示文稿。支持从零创建或从 PPT/PPTX 转换为网页幻灯片。帮助非设计师通过视觉探索找到美学方向。',
  'presentation-deck':            '为利益相关者评审、设计展示构建有说服力的演示结构。结构化演示叙事，提升汇报效果。',
  'elite-powerpoint-designer':    '创建世界级 PPT 演示文稿。专业设计、品牌一致性、高级动画、精致视觉层次。Apple/Microsoft/Google 级别品质。',
  'marp-slide':                   '使用 7 套精美主题（default、minimal、colorful、dark、gradient、tech、business）快速创建 Marp 幻灯片。支持自定义主题和图片布局。',
  'pitch-deck':                   '为创业公司和商业项目生成专业的融资 Pitch Deck。遵循标准 10 页结构，包含内容和设计最佳实践。',
  'vercel-react-best-practices':  'Vercel 官方 React/Next.js 性能优化指南。涵盖组件优化、数据获取、打包优化，确保最优性能模式。',
  'vercel-react-native-skills':   'React Native 和 Expo 最佳实践。移动端性能优化、列表性能、动画实现、原生模块。',
  'deploy-to-vercel':             '将应用和网站部署到 Vercel。一键部署静态网站、Next.js 等项目，支持预览部署。',
  'vercel-cli-with-tokens':       '基于 Token 认证的 Vercel CLI 操作。无需交互式登录即可管理项目、环境变量和部署。',
  'vercel-optimize':              'Vercel 成本与性能优化审计。分析 Function Invocations、Build Minutes、Fast Data Transfer、Core Web Vitals 等指标，提供优化建议。',
  'find-skills':                  'Skill 发现与安装引擎。当你想找某个领域的 Skill 时，直接用自然语言描述需求即可自动搜索匹配。',
  'writing-guidelines':           '文档和文案风格审查。确保文案语调一致、专业，符合写作规范。',
};

// ─── Skill Parsing ──────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const fm = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function extractUsageSection(content) {
  // Extract "When to Use" / "Must Use" / "When to Apply" sections
  const sections = [];
  const lines = content.split('\n');
  let inSection = false;
  let sectionLines = [];

  for (const line of lines) {
    if (/^##\s+(When to|Must Use|When to Apply|Recommended)/i.test(line)) {
      inSection = true;
      sectionLines = [];
      continue;
    }
    if (inSection && line.startsWith('## ')) {
      inSection = false;
      sections.push(...sectionLines);
      continue;
    }
    if (inSection && line.startsWith('- ')) {
      sectionLines.push(line.replace(/^- /, '').trim());
    }
  }
  sections.push(...sectionLines);
  return sections;
}

function getSkillInfo(name) {
  const skillPath = path.join(AGENTS_DIR, name);
  const mdPath = path.join(skillPath, 'SKILL.md');
  const symlinkPath = path.join(CLAUDE_DIR, name);

  if (!fs.existsSync(mdPath)) return null;

  const content = fs.readFileSync(mdPath, 'utf-8');
  const fm = parseFrontmatter(content);
  const usageItems = extractUsageSection(content);

  // Check symlink
  let installType = '未知';
  try {
    if (fs.existsSync(symlinkPath)) {
      const stat = fs.lstatSync(symlinkPath);
      installType = stat.isSymbolicLink() ? '🌐 全局' : '📁 项目';
    }
  } catch { installType = '未知'; }

  // Get file size for a rough gauge
  let fileSize = 0;
  try { fileSize = fs.statSync(mdPath).size; } catch {}

  const meta = CATEGORIES[name] || { cat: '📦 其他', emoji: '📦' };

  return {
    name: fm.name || name,
    dirName: name,
    description: ZH_DESCRIPTIONS[name] || fm.description || '',
    descriptionEn: fm.description || '',
    category: meta.cat,
    emoji: meta.emoji,
    installType,
    suitableProjects: SUITABLE_PROJECTS[name] || [],
    triggerKeywords: TRIGGER_KEYWORDS[name] || [],
    usageItems: usageItems.slice(0, 8), // limit to 8 items from markdown
    fileSize,
    source: fm.license ? (fm.license.includes('Proprietary') ? 'Anthropic' : 'Community') : 'Community',
  };
}

function getAllSkills() {
  const skills = [];
  if (!fs.existsSync(AGENTS_DIR)) return skills;

  const dirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const name of dirs) {
    const info = getSkillInfo(name);
    if (info) skills.push(info);
  }

  // Sort by category then name
  skills.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh');
    return a.name.localeCompare(b.name);
  });

  return skills;
}

// ─── MIME Types ─────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ─── HTTP Server ────────────────────────────────────────────────────────────

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function sendJSON(res, data, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: List all skills
  if (method === 'GET' && url.pathname === '/api/skills') {
    const skills = getAllSkills();
    const stats = {};
    for (const s of skills) {
      stats[s.category] = (stats[s.category] || 0) + 1;
    }
    return sendJSON(res, { skills, stats, total: skills.length });
  }

  // API: Get single skill detail
  if (method === 'GET' && url.pathname.startsWith('/api/skills/')) {
    const name = decodeURIComponent(url.pathname.replace('/api/skills/', ''));
    const info = getSkillInfo(name);
    if (!info) return sendJSON(res, { error: 'Skill not found' }, 404);
    return sendJSON(res, info);
  }

  // API: Delete skill
  if (method === 'DELETE' && url.pathname.startsWith('/api/skills/')) {
    const name = decodeURIComponent(url.pathname.replace('/api/skills/', ''));
    const agentPath = path.join(AGENTS_DIR, name);
    const claudeLink = path.join(CLAUDE_DIR, name);

    const errors = [];

    // Remove symlink
    try {
      if (fs.existsSync(claudeLink)) fs.unlinkSync(claudeLink);
    } catch (e) { errors.push('symlink: ' + e.message); }

    // Remove actual files
    try {
      if (fs.existsSync(agentPath)) fs.rmSync(agentPath, { recursive: true, force: true });
    } catch (e) { errors.push('files: ' + e.message); }

    if (errors.length > 0) {
      return sendJSON(res, { success: false, errors }, 500);
    }
    return sendJSON(res, { success: true, message: `已删除 "${name}"` });
  }

  // Static files
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`🧩 Skill Manager running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => { console.log('\n👋 Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n👋 Shutting down...'); process.exit(0); });
