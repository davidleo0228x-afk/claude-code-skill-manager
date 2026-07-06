const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const AGENTS_DIR = path.join(os.homedir(), '.agents', 'skills');
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'skills');
const CODEX_SKILLS_DIR = path.join(os.homedir(), '.codex', 'skills');
const CODEX_SYSTEM_DIR = path.join(CODEX_SKILLS_DIR, '.system');
const PORT = 3099;
const TRANSLATION_CACHE_PATH = path.join(__dirname, '.translation-cache.json');

// ─── Translation Helpers ──────────────────────────────────────────────────────

function loadTranslationCache() {
  try {
    if (fs.existsSync(TRANSLATION_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(TRANSLATION_CACHE_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveTranslationCache(cache) {
  try {
    fs.writeFileSync(TRANSLATION_CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch {}
}

// Free MyMemory API — no key required, ~5000 chars/day anonymous limit
async function translateToChinese(text) {
  if (!text || text.length < 10) return null;
  try {
    const url = 'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text) + '&langpair=en|zh-CN';
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {}
  return null;
}

// ─── Startup Translation Check ─────────────────────────────────────────────

async function startupTranslationCheck() {
  const cache = loadTranslationCache();
  const skills = getAllSkills();
  let translated = 0, failed = 0, skipped = 0;

  for (const skill of skills) {
    if (skill.hasChineseDesc) { skipped++; continue; }
    if (cache[skill.dirName]) { skipped++; continue; }
    if (!skill.descriptionEn || skill.descriptionEn.length < 10) { skipped++; continue; }

    console.log(`🌐 Translating (${translated + failed + 1}/${skills.length}): ${skill.name}...`);
    const result = await translateToChinese(skill.descriptionEn);
    if (result) {
      cache[skill.dirName] = result;
      saveTranslationCache(cache);
      translated++;
      console.log(`  ✅ ${skill.name}`);
    } else {
      failed++;
      console.log(`  ⚠️  Failed: ${skill.name}`);
    }
    // Rate limit: 500ms between API calls
    await new Promise(r => setTimeout(r, 500));
  }

  if (translated > 0 || failed > 0) {
    console.log(`🎉 Startup translation: ${translated} new, ${failed} failed, ${skipped} skipped`);
  }
}

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

// ─── Codex (OpenCode) Skill Metadata ─────────────────────────────────────────

const CODEX_CATEGORIES = {
  'humanizer':              { cat: '📝 AI 写作 / 润色', emoji: '📝' },
  'humanizer-zh':           { cat: '📝 AI 写作 / 润色', emoji: '📝' },
  'humanizer-zh-academic':  { cat: '📝 AI 写作 / 润色', emoji: '📝' },
  'skill-creator':          { cat: '⚙️ Codex 系统', emoji: '⚙️' },
  'plugin-creator':         { cat: '⚙️ Codex 系统', emoji: '⚙️' },
  'skill-installer':        { cat: '⚙️ Codex 系统', emoji: '⚙️' },
  'openai-docs':            { cat: '⚙️ Codex 系统', emoji: '⚙️' },
  'imagegen':               { cat: '⚙️ Codex 系统', emoji: '⚙️' },
};

const CODEX_SUITABLE_PROJECTS = {
  'humanizer':              ['文本编辑', 'AI 内容检测', '写作辅助', '内容审查'],
  'humanizer-zh':           ['中文写作', '文本润色', '内容编辑', 'AI 降重'],
  'humanizer-zh-academic':  ['学术论文', '期刊文章', '毕业论文', '学术写作', 'AIGC 降重'],
  'skill-creator':          ['Skill 开发', '能力扩展', '插件开发'],
  'plugin-creator':         ['插件开发', 'Codex 扩展', '工具链'],
  'skill-installer':        ['Skill 管理', '能力扩展', '工具安装'],
  'openai-docs':            ['API 开发', 'OpenAI 集成', '模型选型', '参考文档'],
  'imagegen':               ['图片生成', '图像编辑', '视觉素材', '像素图'],
};

const CODEX_TRIGGER_KEYWORDS = {
  'humanizer':              ['humanize', '去AI化', '降低AI痕迹', '改写', '润色', 'natural writing', 'AI detection'],
  'humanizer-zh':           ['润色', '去AI味', '降低AI感', '中文改写', '自然书写', 'AI痕迹'],
  'humanizer-zh-academic':  ['降低AIGC', '学术润色', 'AIGC检测', '论文降重', '学术写作', '降低AI率'],
  'skill-creator':          ['create skill', '创建 skill', '新建技能', '编写 skill', 'skill 开发'],
  'plugin-creator':         ['create plugin', '创建插件', '新建插件', 'plugin 开发', '插件开发'],
  'skill-installer':        ['install skill', '安装 skill', '安装技能', 'install curated', 'skill 安装'],
  'openai-docs':            ['OpenAI API', 'model API', 'Codex API', 'OpenAI 文档', 'API 参考'],
  'imagegen':               ['generate image', '生成图片', 'create image', 'make image', '图片生成', 'draw'],
};

const CODEX_ZH_DESCRIPTIONS = {
  'humanizer':              '去除文本中的 AI 生成痕迹。检测并修复夸大的象征意义、宣传性语言、肤浅的 -ing 分析、模糊归因、破折号过度使用、AI 高频词汇等模式。基于 Wikipedia "Signs of AI writing" 指南。兼容 Claude Code + OpenCode。',
  'humanizer-zh':           '中文文本 AI 去痕迹工具。去除中文文本中的 AI 生成痕迹，使其听起来更自然、更像人类书写。检测并修复中文 AI 写作的典型模式。',
  'humanizer-zh-academic':  '降低中文学术写作 AIGC 检测率。基于真实论文改写实验（AIGC 率从 >50% 降至 11%）归纳的规律，检测并修复中文 AI 写作的典型模式：理论依据式起笔、套路结尾、整齐并列句、模板化问题陈述等。',
  'skill-creator':          'Codex 官方 Skill 创建指南。当需要创建或更新 Skill 以扩展 Codex 能力时使用，包含专业知识、工作流程和工具集成的最佳实践。',
  'plugin-creator':         'Codex 插件创建与脚手架工具。创建包含 .codex-plugin/plugin.json 的插件目录，管理 marketplace 条目。',
  'skill-installer':        'Codex Skill 安装工具。从精选列表或 GitHub 仓库安装 Skills 到 $CODEX_HOME/skills。',
  'openai-docs':            'OpenAI 官方文档参考。当需要查询 OpenAI 产品/API 使用方法、模型选型建议、升级指南时使用。',
  'imagegen':               'Codex 图片生成与编辑。适用于创建新图片、转换已有图片、生成视觉素材——照片、插图、纹理、精灵图、mockup、透明背景抠图等位图资产。',
};

// ─── Skill Parsing ──────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const fm = {};

  // State machine: 'normal' | 'multiline' (|) | 'array' (- items)
  let state = 'normal';
  let collectKey = null;
  let collectVal = [];

  for (let i = 1; i < end; i++) {
    const line = lines[i];

    // ── Continue multiline (indented lines after a `|` key) ──────────
    if (state === 'multiline' && (line.startsWith('  ') || line.trim() === '')) {
      collectVal.push(line.replace(/^  /, ''));
      continue;
    }

    // ── Continue YAML array (indented `- item` lines) ────────────────
    if (state === 'array' && /^  - /.test(line)) {
      collectVal.push(line.replace(/^  - /, '').trim());
      continue;
    }

    // ── Flush current collection ─────────────────────────────────────
    if (state === 'multiline') {
      fm[collectKey] = collectVal.join('\n').trim().replace(/\|\s*$/, '').trim();
    } else if (state === 'array') {
      fm[collectKey] = collectVal;
    }
    state = 'normal';
    collectKey = null;
    collectVal = [];

    // ── Parse key: value ─────────────────────────────────────────────
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    // Multi-line indicator: value starts with `|`
    if (val === '|' || val.startsWith('|')) {
      state = 'multiline';
      collectKey = key;
      collectVal = [];
      if (val.length > 1) collectVal.push(val.slice(1).trim());
      continue;
    }

    // YAML array: empty value (key:) followed by indented `- item`
    if (val === '' || val === '[]') {
      const nextLine = (i + 1 < end) ? lines[i + 1] : '';
      if (/^  - /.test(nextLine)) {
        state = 'array';
        collectKey = key;
        collectVal = [];
        continue;
      }
      fm[key] = '';
      continue;
    }

    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }

  // ── Flush final collection ─────────────────────────────────────────
  if (state === 'multiline') {
    fm[collectKey] = collectVal.join('\n').trim();
  } else if (state === 'array') {
    fm[collectKey] = collectVal;
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

// Parse tags from frontmatter — handles YAML array, comma-separated, single value
function parseTagsField(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  // YAML inline array: [tag1, tag2, tag3]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',')
      .map(t => t.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  // Comma-separated or newline-separated
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [trimmed];
}

// Last-resort fallback: extract key phrases from English description
// when no tags exist in frontmatter or predefined mappings
function extractKeywordsFromDescription(desc) {
  if (!desc) return [];
  // Split on sentence boundaries
  const sentences = desc.split(/[.;]\s*/);
  const keywords = [];
  for (const sentence of sentences) {
    // Extract comma-separated items (e.g. "writing, reviewing, or refactoring")
    const items = sentence.split(/,\s*/);
    for (const item of items) {
      const cleaned = item.replace(/^and\s+|^or\s+|\.$/g, '').trim();
      // Keep meaningful phrases: 2-6 words, not too long
      const wordCount = cleaned.split(/\s+/).length;
      if (wordCount >= 2 && wordCount <= 6 && cleaned.length > 10 && cleaned.length < 80) {
        keywords.push(cleaned);
        if (keywords.length >= 5) return keywords;
      }
    }
  }
  return keywords;
}

// Guess category from skill name + description when no predefined mapping exists
function guessCategory(name, description) {
  const text = (name + ' ' + (description || '')).toLowerCase();

  if (/design|\b(ui|ux)\b|website|landing|layout|visual|style.guide|interface|wireframe|设计/.test(text))
    return { cat: '🎨 设计 / UI', emoji: '🎨' };
  if (/animation|motion|scroll|transition|parallax|动效|动画/.test(text))
    return { cat: '✨ 动效 / 动画', emoji: '✨' };
  if (/ppt|slide|presentation|deck|演示|幻灯片/.test(text))
    return { cat: '📊 PPT / 演示', emoji: '📊' };
  if (/react|next\.?js|frontend|前端/.test(text))
    return { cat: '⚛️ React 前端', emoji: '⚛️' };
  if (/deploy|vercel|ci\/cd|部署|运维/.test(text))
    return { cat: '🚀 部署 / 运维', emoji: '🚀' };
  if (/writing|guideline|review|refactor|写作|文档/.test(text))
    return { cat: '🔧 工具 / 写作', emoji: '🔧' };
  if (/\b(ai|llm|gpt|model)\b|模型/.test(text))
    return { cat: '🤖 AI / LLM', emoji: '🤖' };
  if (/system|plugin|插件/.test(text))
    return { cat: '⚙️ 系统 / 插件', emoji: '⚙️' };

  return null;
}

// Guess an emoji for a user-defined category name
function guessCategoryEmoji(cat) {
  const lower = cat.toLowerCase();
  if (/design|\bui\b|设计|样式|视觉/.test(lower)) return '🎨';
  if (/animation|motion|动画|动效|scroll/.test(lower)) return '✨';
  if (/ppt|slide|演示|present/.test(lower)) return '📊';
  if (/react|frontend|前端|next/.test(lower)) return '⚛️';
  if (/deploy|部署|ci|cd|server|运维/.test(lower)) return '🚀';
  if (/writing|写作|文档|doc/.test(lower)) return '📝';
  if (/tool|工具|util|helper/.test(lower)) return '🔧';
  if (/ai|llm|gpt|model|模型/.test(lower)) return '🤖';
  if (/system|系统|plugin|插件/.test(lower)) return '⚙️';
  if (/data|数据|database|db/.test(lower)) return '🗄️';
  if (/test|测试|qa/.test(lower)) return '🧪';
  if (/security|安全|auth/.test(lower)) return '🔒';
  if (/image|图片|imagegen/.test(lower)) return '🖼️';
  return '📦';
}

function getSkillInfo(name, basePath, platform, cache = {}) {
  const skillPath = path.join(basePath, name);
  const mdPath = path.join(skillPath, 'SKILL.md');
  const symlinkPath = platform === 'claude-code' ? path.join(CLAUDE_DIR, name) : null;

  if (!fs.existsSync(mdPath)) return null;

  const content = fs.readFileSync(mdPath, 'utf-8');
  const fm = parseFrontmatter(content);
  const usageItems = extractUsageSection(content);

  // Check symlink (Claude Code only)
  let installType = '未知';
  if (symlinkPath) {
    try {
      if (fs.existsSync(symlinkPath)) {
        const stat = fs.lstatSync(symlinkPath);
        installType = stat.isSymbolicLink() ? '🌐 全局' : '📁 项目';
      }
    } catch { installType = '未知'; }
  } else {
    installType = '📁 本地';
  }

  // Get file size
  let fileSize = 0;
  try { fileSize = fs.statSync(mdPath).size; } catch {}

  // ── Frontmatter fallbacks for unknown/new skills ──────────────────────
  const fmTags = parseTagsField(fm.tags || fm.keywords);
  const fmCategory = fm.category || null;

  // Pick metadata from the correct mapping; fall back to frontmatter → generic
  let meta = platform === 'codex' ? CODEX_CATEGORIES[name] : CATEGORIES[name];
  if (!meta && fmCategory) {
    meta = { cat: fmCategory, emoji: guessCategoryEmoji(fmCategory) };
  }
  if (!meta) meta = guessCategory(name, fm.description);
  if (!meta) meta = { cat: '📦 其他', emoji: '📦' };

  // Description: predefined → cached translation → frontmatter description → empty
  const hasChineseDesc = !!(platform === 'codex'
    ? CODEX_ZH_DESCRIPTIONS[name]
    : ZH_DESCRIPTIONS[name]);
  const desc = platform === 'codex'
    ? (CODEX_ZH_DESCRIPTIONS[name] || cache[name] || fm.description || '')
    : (ZH_DESCRIPTIONS[name] || cache[name] || fm.description || '');

  // Suitable projects: predefined only (no standard frontmatter field for this)
  const projects = platform === 'codex'
    ? (CODEX_SUITABLE_PROJECTS[name] || [])
    : (SUITABLE_PROJECTS[name] || []);

  // Trigger keywords: predefined → frontmatter tags → description extraction → empty
  const keywords = (() => {
    // 1) Predefined mapping
    const predef = platform === 'codex' ? CODEX_TRIGGER_KEYWORDS[name] : TRIGGER_KEYWORDS[name];
    if (predef && predef.length) return predef;
    // 2) Frontmatter tags
    if (fmTags.length) return fmTags;
    // 3) Extract from description (last resort)
    return extractKeywordsFromDescription(fm.description || '');
  })();

  // Determine compatibility
  let compatibility = platform;
  if (fm.compatibility) {
    const compat = fm.compatibility.toLowerCase();
    if (compat.includes('claude-code') && compat.includes('opencode')) {
      compatibility = 'dual';
    } else if (compat.includes('opencode') || compat.includes('codex')) {
      compatibility = 'codex';
    } else if (compat.includes('claude-code')) {
      compatibility = 'claude-code';
    }
  }

  return {
    name: fm.name || name,
    dirName: name,
    description: desc,
    descriptionEn: fm.description || '',
    category: meta.cat,
    emoji: meta.emoji,
    installType,
    suitableProjects: projects,
    triggerKeywords: keywords,
    usageItems: usageItems.slice(0, 8),
    fileSize,
    platform,
    compatibility,
    version: fm.version || '',
    source: fm.license ? (fm.license.includes('Proprietary') ? 'Anthropic' : 'Community') : 'Community',
    hasChineseDesc,
  };
}

function getAllSkills() {
  const skills = [];
  const cache = loadTranslationCache();

  // ── Claude Code skills ────────────────────────────────
  if (fs.existsSync(AGENTS_DIR)) {
    const dirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const name of dirs) {
      const info = getSkillInfo(name, AGENTS_DIR, 'claude-code', cache);
      if (info) skills.push(info);
    }
  }

  // ── Codex skills (non-system) ─────────────────────────
  if (fs.existsSync(CODEX_SKILLS_DIR)) {
    const dirs = fs.readdirSync(CODEX_SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== '.system')
      .map(d => d.name);
    for (const name of dirs) {
      const info = getSkillInfo(name, CODEX_SKILLS_DIR, 'codex', cache);
      if (info) skills.push(info);
    }

    // ── Codex system skills ─────────────────────────────
    if (fs.existsSync(CODEX_SYSTEM_DIR)) {
      const sysDirs = fs.readdirSync(CODEX_SYSTEM_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      for (const name of sysDirs) {
        const info = getSkillInfo(name, CODEX_SYSTEM_DIR, 'codex', cache);
        if (info) {
          info.isSystem = true;
          info.installType = '⚙️ 系统内置';
          skills.push(info);
        }
      }
    }
  }

  // Sort by platform, category, then name
  skills.sort((a, b) => {
    const pa = a.platform === 'codex' ? 1 : 0;
    const pb = b.platform === 'codex' ? 1 : 0;
    if (pa !== pb) return pa - pb;
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

const server = http.createServer(async (req, res) => {
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
    const platformStats = { 'claude-code': 0, 'codex': 0 };
    for (const s of skills) {
      stats[s.category] = (stats[s.category] || 0) + 1;
      if (s.platform === 'claude-code') platformStats['claude-code']++;
      else platformStats['codex']++;
    }
    return sendJSON(res, { skills, stats, platformStats, total: skills.length });
  }

  // API: Get single skill detail — search both platforms
  if (method === 'GET' && url.pathname.startsWith('/api/skills/')) {
    const name = decodeURIComponent(url.pathname.replace('/api/skills/', ''));
    // Try Claude Code first, then Codex, then Codex system
    const cache = loadTranslationCache();
    let info = getSkillInfo(name, AGENTS_DIR, 'claude-code', cache)
            || getSkillInfo(name, CODEX_SKILLS_DIR, 'codex', cache)
            || getSkillInfo(name, CODEX_SYSTEM_DIR, 'codex', cache);
    if (!info) return sendJSON(res, { error: 'Skill not found' }, 404);
    // Mark system skills
    if (!info.isSystem && fs.existsSync(path.join(CODEX_SYSTEM_DIR, name))) info.isSystem = true;

    // ── Auto-translate: if no predefined Chinese description, translate on demand ──
    if (!info.hasChineseDesc && info.descriptionEn && !cache[name]) {
      const translated = await translateToChinese(info.descriptionEn);
      if (translated) {
        info.description = translated;
        cache[name] = translated;
        saveTranslationCache(cache);
      }
    }

    return sendJSON(res, info);
  }

  // API: Delete skill — handles both Claude Code and Codex
  if (method === 'DELETE' && url.pathname.startsWith('/api/skills/')) {
    const name = decodeURIComponent(url.pathname.replace('/api/skills/', ''));
    const agentPath = path.join(AGENTS_DIR, name);
    const claudeLink = path.join(CLAUDE_DIR, name);
    const codexPath = path.join(CODEX_SKILLS_DIR, name);
    const codexSysPath = path.join(CODEX_SYSTEM_DIR, name);

    const errors = [];

    // Remove Claude Code symlink
    try {
      if (fs.existsSync(claudeLink)) fs.unlinkSync(claudeLink);
    } catch (e) { errors.push('claude symlink: ' + e.message); }

    // Remove from ~/.agents/skills (Claude Code)
    try {
      if (fs.existsSync(agentPath)) fs.rmSync(agentPath, { recursive: true, force: true });
    } catch (e) { errors.push('claude files: ' + e.message); }

    // Remove from ~/.codex/skills (Codex)
    try {
      if (fs.existsSync(codexPath)) fs.rmSync(codexPath, { recursive: true, force: true });
    } catch (e) { errors.push('codex files: ' + e.message); }

    // Remove from ~/.codex/skills/.system (Codex system)
    try {
      if (fs.existsSync(codexSysPath)) fs.rmSync(codexSysPath, { recursive: true, force: true });
    } catch (e) { errors.push('codex system files: ' + e.message); }

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
  startupTranslationCheck();
});

// Graceful shutdown
process.on('SIGINT', () => { console.log('\n👋 Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n👋 Shutting down...'); process.exit(0); });
