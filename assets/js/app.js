/* ==========================================================================
   造物录 · 渲染逻辑
   纯原生 JS，无依赖，无构建步骤。双击 index.html 即可运行。
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------- 工具函数 */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  function byId(id) {
    for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) return CASES[i];
    return null;
  }

  function uniqueStack() {
    var seen = {}, out = [];
    CASES.forEach(function (c) {
      (c.stack || []).forEach(function (s) {
        if (!seen[s]) { seen[s] = 1; out.push(s); }
      });
    });
    return out;
  }

  function latestDate() {
    var d = "";
    CASES.forEach(function (c) { if (c.date && c.date > d) d = c.date; });
    return d;
  }

  /* ---------------------------------------------------------- 页头页脚 */

  function mountChrome() {
    var brand = document.querySelector("[data-brand]");
    if (brand) brand.textContent = SITE.name;

    var sub = document.querySelector("[data-brand-sub]");
    if (sub) sub.textContent = SITE.sub;

    var yr = document.querySelector("[data-year]");
    if (yr) yr.textContent = String(new Date().getFullYear());

    var name = document.querySelector("[data-foot-name]");
    if (name) name.textContent = SITE.name + " · " + SITE.sub;

    var contact = document.querySelector("[data-contact]");
    if (contact) {
      if (SITE.contactUrl) {
        contact.innerHTML =
          '<a href="' + esc(SITE.contactUrl) + '" target="_blank" rel="noopener">' +
          esc(SITE.contact) + "</a>";
      } else {
        contact.textContent = SITE.contact || "";
      }
    }

    var page = document.body.getAttribute("data-page");
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------------------------------------------------------- 回到顶部 */

  function mountToTop() {
    if (document.querySelector(".to-top")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "回到顶部");
    btn.setAttribute("data-to-top", "1");
    btn.textContent = "\u2191";
    document.body.appendChild(btn);

    function sync() {
      btn.setAttribute("data-show", String((window.scrollY || 0) > 600));
    }

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  /* ---------------------------------------------------------- 首页 */

  var state = { cat: "全部", q: "" };

  function renderHome() {
    var eyebrow = document.querySelector("[data-hero-eyebrow]");
    if (eyebrow) eyebrow.textContent = SITE.hero.eyebrow;

    var h1 = document.querySelector("[data-hero-title]");
    if (h1) h1.textContent = SITE.hero.title;

    var lead = document.querySelector("[data-hero-lead]");
    if (lead) lead.textContent = SITE.hero.lead;

    renderStats();
    renderNotice();
    renderFilters();
    renderGrid();
    bindToolbar();
  }

  function renderStats() {
    var box = document.querySelector("[data-stats]");
    if (!box) return;

    var items = [
      { n: String(CASES.length).padStart(2, "0"), l: "已收录案例" },
      { n: String(uniqueStack().length), l: "涉及工具与模型" },
      { n: latestDate().slice(5).replace("-", "/") || "—", l: "最近更新" },
    ];

    box.innerHTML = items
      .map(function (it) {
        return (
          '<div class="stat"><div class="stat-num">' + esc(it.n) + "</div>" +
          '<div class="stat-label">' + esc(it.l) + "</div></div>"
        );
      })
      .join("");
  }

  function latestCase() {
    var latest = null;
    CASES.forEach(function (c) {
      if (!latest || (c.date || "") > (latest.date || "")) latest = c;
    });
    return latest;
  }

  function renderNotice() {
    var box = document.querySelector("[data-notice]");
    if (!box) return;

    var text = String(SITE.notice || "").trim();

    if (!text) {
      var latest = latestCase();
      if (!latest) return;
      var t = String(latest.title || "").replace(/[《》]/g, "");
      text = "最近更新 " + latest.date + " · 《" + t + "》";
    }

    box.innerHTML =
      '<div class="notice"><span class="notice-mark"></span><span>' +
      esc(text) +
      "</span></div>";
  }

  function renderFilters() {
    var box = document.querySelector("[data-filters]");
    if (!box) return;

    var cats = ["全部"];
    CASES.forEach(function (c) {
      if (c.category && cats.indexOf(c.category) === -1) cats.push(c.category);
    });

    box.innerHTML = cats
      .map(function (c) {
        return (
          '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="' +
          (c === state.cat) + '">' + esc(c) + "</button>"
        );
      })
      .join("");
  }

  function matches(c) {
    if (state.cat !== "全部" && c.category !== state.cat) return false;
    if (!state.q) return true;
    var hay = [c.title, c.subtitle, c.summary, (c.tags || []).join(" "), (c.stack || []).join(" ")]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(state.q.toLowerCase()) !== -1;
  }

  function renderGrid() {
    var box = document.querySelector("[data-grid]");
    if (!box) return;

    var list = CASES.filter(matches);
    var count = document.querySelector("[data-count]");
    if (count) count.textContent = "共 " + list.length + " 个案例";

    if (!list.length) {
      box.innerHTML = '<div class="empty">没有匹配的案例，换个关键词或分类试试。</div>';
      return;
    }

    box.innerHTML = list
      .map(function (c) {
        return (
          '<a class="card" href="case.html?id=' + encodeURIComponent(c.id) + '">' +
            '<div class="card-media">' +
              '<span class="card-badge">' + esc(c.category) + "</span>" +
              '<img src="' + esc(c.cover) + '" alt="' + esc(c.title) + '" loading="lazy">' +
            "</div>" +
            '<div class="card-body">' +
              '<h3 class="card-title">' + esc(c.title) + "</h3>" +
              '<p class="card-sub">' + esc(c.summary) + "</p>" +
              '<div class="card-foot"><span>' + esc((c.stack || []).join(" / ")) + "</span>" +
                '<span class="sep">/</span><span>' + esc(c.year) + "</span></div>" +
            "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function bindToolbar() {
    var box = document.querySelector("[data-filters]");
    if (box && !box.dataset.bound) {
      box.dataset.bound = "1";
      box.addEventListener("click", function (e) {
        var btn = e.target.closest(".chip");
        if (!btn) return;
        state.cat = btn.getAttribute("data-cat");
        box.querySelectorAll(".chip").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        renderGrid();
      });
    }

    var input = document.querySelector("[data-search]");
    if (input && !input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", function () {
        state.q = input.value.trim();
        renderGrid();
      });
    }
  }

  /* ---------------------------------------------------------- 案例详情 */

  function renderCase() {
    var root = document.querySelector("[data-case]");
    if (!root) return;

    var c = byId(qs("id"));
    if (!c) {
      root.innerHTML =
        '<div class="empty">没有找到这个案例。<br><br>' +
        '<a class="backlink" href="index.html">返回作品墙</a></div>';
      return;
    }

    document.title = c.title + " · " + SITE.name;

    var specs = (c.specs || [])
      .map(function (s) {
        return (
          '<div class="spec-item"><div class="spec-key">' + esc(s.k) + "</div>" +
          '<div class="spec-val">' + esc(s.v) + "</div></div>"
        );
      })
      .join("");

    var intro = c.intro
      ? '<div class="block" id="block-intro"><h2>项目说明</h2>' +
        '<div class="prose"><p>' + esc(c.intro) + "</p></div></div>"
      : "";

    var tools = (c.tools || []).length
      ? '<div class="block" id="block-tools"><h2>工具链</h2>' +
        '<p class="block-note">这条案例里每个工具具体负责什么</p><div class="chain">' +
        c.tools
          .map(function (t, i) {
            var arrow = i > 0 ? '<span class="chain-arrow" aria-hidden="true">\u2192</span>' : "";
            return (
              arrow +
              '<div class="chain-item"><div class="chain-name">' + esc(t.name) + "</div>" +
              '<div class="chain-role">' + esc(t.role) + "</div></div>"
            );
          })
          .join("") +
        "</div></div>"
      : "";

    var gallery = (c.gallery || []).length
      ? '<div class="block" id="block-gallery"><h2>成品展示</h2>' +
        '<p class="block-note">点击可放大，支持方向键翻页</p><div class="gallery">' +
        c.gallery
          .map(function (g, i) {
            return (
              '<button class="shot" type="button" data-shot="' + i + '">' +
                '<img src="' + esc(g.src) + '" alt="' + esc(g.caption) + '" loading="lazy">' +
                '<div class="shot-cap">' + esc(g.caption) + "</div>" +
              "</button>"
            );
          })
          .join("") +
        "</div></div>"
      : "";

    var steps = (c.steps || []).length
      ? '<div class="block" id="block-steps"><h2>制作拆解</h2>' +
        '<p class="block-note">每一步的提示词与关键参数</p><div class="steps">' +
        c.steps
          .map(function (s) {
            var promptBox = s.prompt
              ? '<div class="prompt-box"><span class="prompt-tag">提示词</span>' +
                '<button class="copy-btn" type="button" data-copy="1" title="复制提示词">复制</button>' +
                "<pre>" + esc(s.prompt) + "</pre></div>"
              : "";
            var params = (s.params || []).length
              ? '<div class="params">' +
                s.params.map(function (p) { return '<span class="param">' + esc(p) + "</span>"; }).join("") +
                "</div>"
              : "";
            return (
              '<div class="step"><div class="step-name">' + esc(s.name) + "</div>" +
              '<div class="step-desc">' + esc(s.desc) + "</div>" + promptBox + params + "</div>"
            );
          })
          .join("") +
        "</div></div>"
      : "";

    var retroItems = ((c.retro && c.retro.items) || [])
      .map(function (t) { return "<li>" + t + "</li>"; })
      .join("");

    var retro = retroItems
      ? '<div class="block" id="block-retro"><div class="retro"><h3>' +
        esc((c.retro && c.retro.title) || "复盘") +
        "</h3><ol>" + retroItems + "</ol></div></div>"
      : "";

    var tocItems = [
      { id: "block-intro", label: "项目说明", html: intro },
      { id: "block-tools", label: "工具链", html: tools },
      { id: "block-gallery", label: "成品展示", html: gallery },
      { id: "block-steps", label: "制作拆解", html: steps },
      { id: "block-retro", label: "复盘", html: retro },
    ].filter(function (t) { return t.html; });

    var hasToc = tocItems.length > 1;

    var toc = hasToc
      ? '<aside class="toc"><div class="toc-title">本页目录</div>' +
        tocItems
          .map(function (t) {
            return '<a href="#' + t.id + '">' + esc(t.label) + "</a>";
          })
          .join("") +
        "</aside>"
      : "";

    var related = renderRelated(c);

    var idx = CASES.indexOf(c);
    var prev = CASES[idx - 1];
    var next = CASES[idx + 1];
    var pager = "";
    if (prev || next) {
      pager =
        '<div class="pager">' +
        (prev
          ? '<a href="case.html?id=' + encodeURIComponent(prev.id) + '">' +
            '<div class="dir">上一个</div><div class="name">' + esc(prev.title) + "</div></a>"
          : "<span></span>") +
        (next
          ? '<a class="next" href="case.html?id=' + encodeURIComponent(next.id) + '">' +
            '<div class="dir">下一个</div><div class="name">' + esc(next.title) + "</div></a>"
          : "<span></span>") +
        "</div>";
    }

    root.innerHTML =
      '<a class="backlink" href="index.html">返回作品墙</a>' +
      '<h1 class="case-title">' + esc(c.title) + "</h1>" +
      '<p class="case-sub">' + esc(c.subtitle) + "</p>" +
      '<div class="case-cover"><img src="' + esc(c.cover) + '" alt="' + esc(c.title) + '"></div>' +
      '<div class="spec">' + specs + "</div>" +
      '<div class="case-layout' + (hasToc ? "" : " no-toc") + '">' + toc +
        '<div class="case-body">' +
          tocItems.map(function (t) { return t.html; }).join("") +
        "</div>" +
      "</div>" +
      related + pager;

    bindCase(root, c);
    mountTocSpy(root);
  }

  function renderRelated(c) {
    var scored = CASES.filter(function (x) { return x !== c; })
      .map(function (x) {
        var score = x.category === c.category ? 2 : 0;
        (x.tags || []).forEach(function (t) {
          if ((c.tags || []).indexOf(t) !== -1) score += 1;
        });
        return { c: x, score: score };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 2)
      .map(function (x) { return x.c; });

    if (!scored.length) return "";

    return (
      '<div class="block block-related"><h2>相关案例</h2>' +
      '<div class="related">' +
      scored
        .map(function (x) {
          return (
            '<a href="case.html?id=' + encodeURIComponent(x.id) + '">' +
              '<img src="' + esc(x.cover) + '" alt="' + esc(x.title) + '" loading="lazy">' +
              "<div><div class=\"related-title\">" + esc(x.title) + "</div>" +
              '<div class="related-cat">' + esc(x.category) + "</div></div>" +
            "</a>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function mountTocSpy(root) {
    var links = Array.prototype.slice.call(root.querySelectorAll(".toc a"));
    if (!links.length) return;

    var blocks = links.map(function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    });

    function update() {
      var y = (window.scrollY || 0) + 140;
      var active = 0;
      for (var i = 0; i < blocks.length; i++) {
        if (!blocks[i]) continue;
        var top = blocks[i].getBoundingClientRect().top + (window.scrollY || 0);
        if (top <= y) active = i;
      }
      links.forEach(function (a, i) {
        a.setAttribute("aria-current", String(i === active));
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function bindCase(root, c) {
    var box = document.getElementById("lightbox");
    var boxImg = box ? box.querySelector("img") : null;
    var boxCap = box ? box.querySelector("[data-lb-cap]") : null;
    var boxCount = box ? box.querySelector("[data-lb-count]") : null;
    var shots = (c.gallery || []).length;
    var current = -1;

    function show(i) {
      if (!box || !shots) return;
      current = (i + shots) % shots;
      var g = c.gallery[current];
      boxImg.src = g.src;
      boxImg.alt = g.caption || "";
      boxCap.textContent = g.caption || "";
      if (boxCount) boxCount.textContent = (current + 1) + " / " + shots;
      box.setAttribute("data-open", "true");
    }

    function close() {
      if (box) box.setAttribute("data-open", "false");
      current = -1;
    }

    root.addEventListener("click", function (e) {
      var copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        var pre = copyBtn.parentElement.querySelector("pre");
        copyText(pre ? pre.textContent : "");
        copyBtn.textContent = "已复制";
        setTimeout(function () { copyBtn.textContent = "复制"; }, 1400);
        return;
      }

      var shot = e.target.closest("[data-shot]");
      if (shot) show(Number(shot.getAttribute("data-shot")));
    });

    if (box) {
      box.addEventListener("click", function (e) {
        if (e.target.closest("[data-lb-prev]")) { show(current - 1); return; }
        if (e.target.closest("[data-lb-next]")) { show(current + 1); return; }
        if (e.target.closest("[data-lb-count]")) return;
        close();
      });

      document.addEventListener("keydown", function (e) {
        if (box.getAttribute("data-open") !== "true") return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "ArrowRight") show(current + 1);
      });
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
      return;
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) { /* 忽略 */ }
    document.body.removeChild(ta);
  }

  /* ---------------------------------------------------------- 关于页 */

  function renderAbout() {
    var box = document.querySelector("[data-about-stack]");
    if (!box) return;

    var models = uniqueStack();
    var cats = [];
    CASES.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });

    var rows = [
      { k: "用过的工具与模型", v: models.join("、") },
      { k: "覆盖的成果类型", v: cats.join("、") },
      { k: "累计案例", v: CASES.length + " 个" },
      { k: "最近更新", v: latestDate() || "—" },
    ];

    box.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="stack-row"><dt>' + esc(r.k) + "</dt><dd>" + esc(r.v) + "</dd></div>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------------- 启动 */

  document.addEventListener("DOMContentLoaded", function () {
    mountChrome();
    mountToTop();
    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHome();
    if (page === "case") renderCase();
    if (page === "about") renderAbout();
  });
})();
