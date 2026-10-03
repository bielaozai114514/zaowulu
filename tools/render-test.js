/* 造物录 · 渲染与交互自动化测试（jsdom）
   运行：
   NODE_PATH="D:/Users/86150/.workbuddy-ai/binaries/node/workspace/node_modules" \
   "D:/Users/86150/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe" tools/render-test.js
*/
const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const pass = [];
const fail = [];

function ok(name, cond, extra) {
  if (cond) pass.push(name);
  else fail.push(name + (extra ? "  →  " + extra : ""));
}

function load(file, query) {
  const abs = path.join(ROOT, file);
  const url = "file:///" + abs.replace(/\\/g, "/") + (query || "");
  return JSDOM.fromFile(abs, {
    url,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  }).then(
    (dom) =>
      new Promise((res) => {
        if (dom.window.document.readyState === "complete") return res(dom);
        dom.window.addEventListener("load", () => res(dom));
        setTimeout(() => res(dom), 4000);
      })
  );
}

function count(dom, sel) {
  return dom.window.document.querySelectorAll(sel).length;
}

function text(dom, sel) {
  const el = dom.window.document.querySelector(sel);
  return el ? el.textContent.trim() : "";
}

(async function main() {
  /* ---------------------------------------------------------- 首页 */
  const home = await load("index.html");
  const hd = home.window.document;

  ok("首页：标题已渲染", text(home, "[data-hero-title]").length > 8);
  ok("首页：导语已渲染", text(home, "[data-hero-lead]").length > 20);
  ok("首页：站名已渲染", text(home, ".brand-mark") === "造物录");

  const stats = hd.querySelectorAll(".stat-num");
  ok("首页：统计卡 3 个", stats.length === 3, "实际 " + stats.length);
  ok("首页：案例数 = 03", stats[0] && stats[0].textContent === "03", stats[0] && stats[0].textContent);
  ok("首页：工具数 = 7", stats[1] && stats[1].textContent === "7", stats[1] && stats[1].textContent);
  ok("首页：最近更新 = 10/01", stats[2] && stats[2].textContent === "10/01", stats[2] && stats[2].textContent);
  ok("首页：不出现「成本」字样", hd.body.textContent.indexOf("成本") === -1);
  ok("首页：不出现金额符号", hd.body.textContent.indexOf("¥") === -1);

  ok("首页：公告条已渲染", text(home, ".notice").length > 8);
  ok("首页：公告条显示最近更新", text(home, ".notice").indexOf("最近更新") === 0, text(home, ".notice"));
  ok("首页：公告条指向最新案例", text(home, ".notice").indexOf("口播视频流水线") > -1, text(home, ".notice"));
  ok("首页：公告条不含内部说明", text(home, ".notice").indexOf("data.js") === -1);
  ok("首页：公告条不含「示例」字样", text(home, ".notice").indexOf("示例") === -1);

  const chips = hd.querySelectorAll(".chip");
  ok("首页：筛选按钮 4 个", chips.length === 4, "实际 " + chips.length);
  ok("首页：默认选中「全部」", chips[0] && chips[0].getAttribute("aria-pressed") === "true");

  ok("首页：作品卡片 3 张", count(home, ".grid .card") === 3, "实际 " + count(home, ".grid .card"));
  ok("首页：计数文案正确", text(home, "[data-count]").indexOf("3 个案例") > -1, text(home, "[data-count]"));

  const firstCard = hd.querySelector(".grid .card");
  ok("首页：卡片链接带 id", firstCard && firstCard.getAttribute("href") === "case.html?id=nocturne");
  ok("首页：卡片有封面图", firstCard && !!firstCard.querySelector("img"));
  ok("首页：卡片有分类角标", firstCard && !!firstCard.querySelector(".card-badge"));

  /* 分类筛选 */
  const beastsChip = Array.from(chips).find((c) => c.getAttribute("data-cat") === "AI 插画");
  beastsChip.dispatchEvent(new home.window.MouseEvent("click", { bubbles: true }));
  ok("首页：按「AI 插画」筛选后 1 张", count(home, ".grid .card") === 1, "实际 " + count(home, ".grid .card"));
  ok("首页：筛选后按钮态更新", beastsChip.getAttribute("aria-pressed") === "true");

  chips[0].dispatchEvent(new home.window.MouseEvent("click", { bubbles: true }));
  ok("首页：切回「全部」恢复 3 张", count(home, ".grid .card") === 3);

  /* 搜索 */
  const input = hd.querySelector("[data-search]");
  input.value = "可灵";
  input.dispatchEvent(new home.window.Event("input", { bubbles: true }));
  ok("首页：搜索「可灵」命中 1 张", count(home, ".grid .card") === 1, "实际 " + count(home, ".grid .card"));

  input.value = "不存在的关键词xyz";
  input.dispatchEvent(new home.window.Event("input", { bubbles: true }));
  ok("首页：无结果时显示空状态", count(home, ".empty") === 1);

  input.value = "";
  input.dispatchEvent(new home.window.Event("input", { bubbles: true }));
  ok("首页：清空搜索恢复 3 张", count(home, ".grid .card") === 3);

  /* ---------------------------------------------------------- 案例详情 */
  const cs = await load("case.html", "?id=nocturne");
  ok("详情：《夜行》标题", text(cs, ".case-title") === "《夜行》", text(cs, ".case-title"));
  ok("详情：副标题已渲染", text(cs, ".case-sub").length > 6);
  ok("详情：大封面存在", count(cs, ".case-cover img") === 1);
  ok("详情：指标 5 项", count(cs, ".spec-item") === 5, "实际 " + count(cs, ".spec-item"));
  ok("详情：画廊 3 张", count(cs, ".shot") === 3, "实际 " + count(cs, ".shot"));
  ok("详情：步骤 6 步", count(cs, ".step") === 6, "实际 " + count(cs, ".step"));
  ok("详情：提示词框 3 个", count(cs, ".prompt-box") === 3, "实际 " + count(cs, ".prompt-box"));
  ok("详情：参数标签存在", count(cs, ".param") > 5, "实际 " + count(cs, ".param"));
  ok("详情：复盘 4 条", count(cs, ".retro li") === 4, "实际 " + count(cs, ".retro li"));
  ok("详情：复盘保留加粗", count(cs, ".retro strong") === 4, "实际 " + count(cs, ".retro strong"));
  ok("详情：返回链接存在", count(cs, ".backlink") === 1);
  ok("详情：首个案例只有「下一个」", count(cs, ".pager a") === 1 && text(cs, ".pager .name").length > 0);
  ok("详情：页面标题已更新", cs.window.document.title.indexOf("夜行") > -1, cs.window.document.title);
  ok("详情：不出现「成本」字样", cs.window.document.body.textContent.indexOf("成本") === -1);
  ok("详情：不出现金额符号", cs.window.document.body.textContent.indexOf("¥") === -1);
  ok("详情：不出现「免费额度」", cs.window.document.body.textContent.indexOf("免费额度") === -1);

  /* 灯箱 */
  const lb = cs.window.document.getElementById("lightbox");
  cs.window.document.querySelector(".shot").dispatchEvent(new cs.window.MouseEvent("click", { bubbles: true }));
  ok("详情：点击画廊打开灯箱", lb.getAttribute("data-open") === "true");
  ok("详情：灯箱有说明文字", text(cs, "[data-lb-cap]").length > 3);
  lb.dispatchEvent(new cs.window.MouseEvent("click", { bubbles: true }));
  ok("详情：点击灯箱关闭", lb.getAttribute("data-open") === "false");

  /* 复制按钮 */
  const copyBtn = cs.window.document.querySelector(".copy-btn");
  copyBtn.dispatchEvent(new cs.window.MouseEvent("click", { bubbles: true }));
  ok("详情：复制按钮有反馈", copyBtn.textContent === "已复制", copyBtn.textContent);

  /* 中间案例应同时有上/下一个 */
  const mid = await load("case.html", "?id=beasts");
  ok("详情：中间案例有上/下一个", count(mid, ".pager a") === 2, "实际 " + count(mid, ".pager a"));

  /* 最后一个案例 */
  const last = await load("case.html", "?id=pipeline");
  ok("详情：末个案例标题正确", text(last, ".case-title") === "口播视频流水线", text(last, ".case-title"));
  ok("详情：末个案例只有「上一个」", count(last, ".pager a") === 1);

  /* 无效 id */
  const bad = await load("case.html", "?id=nope");
  ok("详情：无效 id 显示提示", count(bad, ".empty") === 1);
  ok("详情：无效 id 有返回入口", count(bad, ".backlink") === 1);

  /* ---------------------------------------------------------- 关于页 */
  const ab = await load("about.html");
  ok("关于：标题渲染", text(ab, ".page-head h1") === "关于这个站");
  ok("关于：数据行 4 行", count(ab, ".stack-row") === 4, "实际 " + count(ab, ".stack-row"));
  ok("关于：含工具清单", text(ab, ".stack-list").indexOf("即梦") > -1);
  ok("关于：含最近更新", text(ab, ".stack-list").indexOf("2026-10-01") > -1);
  ok("关于：面板 4 块", count(ab, ".panel") === 4, "实际 " + count(ab, ".panel"));
  ok("关于：不出现「成本」字样", ab.window.document.body.textContent.indexOf("成本") === -1);

  /* ---------------------------------------------------------- 新增模块 */
  const cs2 = await load("case.html", "?id=nocturne");
  const d2 = cs2.window.document;

  ok("目录：存在侧边目录", count(cs2, ".toc") === 1);
  ok("目录：链接 5 条", count(cs2, ".toc a") === 5, "实际 " + count(cs2, ".toc a"));
  ok("目录：恰好一条高亮", count(cs2, '.toc a[aria-current="true"]') === 1,
    "实际 " + count(cs2, '.toc a[aria-current="true"]'));
  ok("目录：锚点目标都存在", ["block-intro", "block-tools", "block-gallery", "block-steps", "block-retro"]
    .every((id) => !!d2.getElementById(id)));
  ok("布局：双栏容器存在", count(cs2, ".case-layout") === 1);

  ok("工具链：区块存在", count(cs2, "#block-tools") === 1);
  ok("工具链：3 个环节", count(cs2, ".chain-item") === 3, "实际 " + count(cs2, ".chain-item"));
  ok("工具链：箭头 2 个", count(cs2, ".chain-arrow") === 2, "实际 " + count(cs2, ".chain-arrow"));
  ok("工具链：含职责说明", text(cs2, ".chain-role").length > 6);

  ok("相关案例：区块存在", count(cs2, ".block-related") === 1);
  ok("相关案例：2 个", count(cs2, ".related a") === 2, "实际 " + count(cs2, ".related a"));
  ok("相关案例：不含自己", text(cs2, ".related").indexOf("《夜行》") === -1);

  ok("灯箱：计数元素存在", count(cs2, "[data-lb-count]") === 1);
  ok("灯箱：有上一张/下一张按钮", count(cs2, "[data-lb-prev]") === 1 && count(cs2, "[data-lb-next]") === 1);

  const lb2 = d2.getElementById("lightbox");
  d2.querySelectorAll(".shot")[0].dispatchEvent(new cs2.window.MouseEvent("click", { bubbles: true }));
  ok("灯箱：打开显示 1 / 3", text(cs2, "[data-lb-count]") === "1 / 3", text(cs2, "[data-lb-count]"));
  d2.querySelector("[data-lb-next]").dispatchEvent(new cs2.window.MouseEvent("click", { bubbles: true }));
  ok("灯箱：下一张到 2 / 3", text(cs2, "[data-lb-count]") === "2 / 3", text(cs2, "[data-lb-count]"));
  d2.querySelector("[data-lb-prev]").dispatchEvent(new cs2.window.MouseEvent("click", { bubbles: true }));
  ok("灯箱：上一张回到 1 / 3", text(cs2, "[data-lb-count]") === "1 / 3", text(cs2, "[data-lb-count]"));
  d2.dispatchEvent(new cs2.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  ok("灯箱：方向键右切到 2 / 3", text(cs2, "[data-lb-count]") === "2 / 3", text(cs2, "[data-lb-count]"));
  d2.dispatchEvent(new cs2.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok("灯箱：ESC 关闭", lb2.getAttribute("data-open") === "false");
  d2.dispatchEvent(new cs2.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  ok("灯箱：关闭后方向键无效", lb2.getAttribute("data-open") === "false");

  ok("回到顶部：按钮已注入", count(cs2, ".to-top") === 1);
  ok("回到顶部：初始隐藏", d2.querySelector(".to-top").getAttribute("data-show") === "false");
  ok("回到顶部：首页也有", count(home, ".to-top") === 1);

  ok("无障碍：首页有跳过链接", count(home, ".skip-link") === 1);
  ok("无障碍：详情页有跳过链接", count(cs2, ".skip-link") === 1);
  ok("无障碍：关于页有跳过链接", count(ab, ".skip-link") === 1);
  ok("无障碍：main 有 id", !!hd.getElementById("main"));
  ok("页脚：联系方式是可点链接", !!hd.querySelector('.site-footer a[href^="https://"]'));
  ok("页脚：链接指向 GitHub", (hd.querySelector(".site-footer a") || {}).href.indexOf("github.com") > -1);
  ok("页脚：不再出现占位邮箱", hd.querySelector(".site-footer").textContent.indexOf("@github") === -1);

  ok("基础：首页有 favicon", !!hd.querySelector('link[rel="icon"]'));
  ok("基础：首页有 OG 标签", !!hd.querySelector('meta[property="og:title"]'));
  ok("基础：详情页有 OG 标签", !!d2.querySelector('meta[property="og:title"]'));

  /* ---------------------------------------------------------- 资源完整性 */
  const dataSrc = fs.readFileSync(path.join(ROOT, "assets/js/data.js"), "utf8");
  const refs = Array.from(dataSrc.matchAll(/assets\/media\/[A-Za-z0-9._-]+/g)).map((m) => m[0]);
  const missing = Array.from(new Set(refs)).filter((r) => !fs.existsSync(path.join(ROOT, r)));
  ok("资源：所有图片引用都存在", missing.length === 0, "缺失 " + missing.join(", "));

  const pages = ["index.html", "case.html", "about.html"];
  const badRefs = [];
  pages.forEach((p) => {
    const html = fs.readFileSync(path.join(ROOT, p), "utf8");
    Array.from(html.matchAll(/(?:href|src)="([^"]+)"/g)).forEach((m) => {
      const u = m[1];
      if (/^(https?:|#|mailto:)/.test(u)) return;
      const clean = u.split("?")[0];
      if (!fs.existsSync(path.join(ROOT, clean))) badRefs.push(p + " → " + u);
    });
  });
  ok("资源：页面内所有本地引用都存在", badRefs.length === 0, badRefs.join("; "));

  /* ---------------------------------------------------------- 输出 */
  console.log("");
  console.log("通过 " + pass.length + " 项，失败 " + fail.length + " 项");
  if (fail.length) {
    console.log("");
    fail.forEach((f) => console.log("  ✗ " + f));
  }
  console.log("");
  process.exit(fail.length ? 1 : 0);
})().catch((e) => {
  console.error("测试脚本异常：", e);
  process.exit(2);
});
