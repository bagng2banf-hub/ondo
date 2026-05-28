import { dictionaries } from "./i18n.js";

const STORAGE_KEY = "ondo.session.v1";
const state = loadSession();
const app = document.querySelector("#app");

const navItems = ["home", "conversations", "schedule", "insights", "mood", "settings"];
const themes = ["light", "dark", "warm"];
const toneKeys = ["soft", "natural", "professional", "romantic", "cute", "calm", "concise"];

render();

function loadSession() {
  const fallback = { lang: null, authed: false, user: null, theme: "dark", route: "home", mood: "calm" };
  try {
    return { ...fallback, ...JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveSession() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function t(path) {
  const dict = dictionaries[state.lang || "ko"];
  return path.split(".").reduce((obj, key) => obj?.[key], dict) ?? path;
}

function render() {
  document.documentElement.lang = state.lang || "ko";
  document.body.dataset.theme = state.theme;

  if (!state.lang) {
    app.innerHTML = renderLanguageScreen();
  } else if (!state.authed) {
    app.innerHTML = renderAuthScreen();
  } else {
    app.innerHTML = renderShell();
  }
  bindEvents();
}

function renderLanguageScreen() {
  return `
    <main class="entry-screen">
      <section class="entry-visual">
        <div class="ondo-field" aria-hidden="true">
          <span>ONDO</span>
        </div>
        <div class="orbital-card">
          <span>${dictionaries.ko.launch.eyebrow}</span>
          <strong>ONDO</strong>
          <p>${dictionaries.ko.brand.tagline}</p>
        </div>
      </section>
      <section class="entry-panel">
        <p class="eyebrow">${dictionaries.ko.launch.eyebrow}</p>
        <h1>${dictionaries.ko.launch.title}</h1>
        <p>${dictionaries.ko.launch.body}</p>
        <div class="language-grid">
          ${Object.entries(dictionaries).map(([lang, dict]) => `
            <button class="language-card" type="button" data-lang="${lang}">
              <span>${dict.meta.langName}</span>
              <strong>${dict.brand.name}</strong>
              <small>${dict.brand.tagline}</small>
            </button>
          `).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderAuthScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-hero">
        <div class="brand-lockup">
          <span class="logo-mark">O</span>
          <span>${t("brand.name")}</span>
        </div>
        <h1>${t("auth.title")}</h1>
        <p>${t("auth.subtitle")}</p>
        <div class="signal-strip">
          ${metric(t("home.warmth"), 82)}
          ${metric(t("home.clarity"), 76)}
          ${metric(t("home.scheduleFit"), 91)}
        </div>
      </section>
      <section class="auth-card">
        <form id="auth-form" novalidate>
          <label>${t("auth.email")}<input name="email" type="email" autocomplete="email" required placeholder="you@ondo.ai"></label>
          <label>${t("auth.password")}<input name="password" type="password" autocomplete="current-password" required placeholder="••••••••"></label>
          <button class="primary-action" type="submit">${t("auth.login")}</button>
        </form>
        <div class="split-actions">
          <button type="button" data-social="apple">${t("auth.apple")}</button>
          <button type="button" data-social="google">${t("auth.google")}</button>
        </div>
        <button class="ghost-action" type="button" data-guest>${t("auth.guest")}</button>
        <p class="security-note">${t("auth.secure")}<br>${t("auth.demoNotice")}</p>
      </section>
    </main>
  `;
}

function renderShell() {
  return `
    <main class="product-shell">
      <aside class="side-nav">
        <div class="brand-lockup">
          <span class="logo-mark">O</span>
          <span>${t("brand.name")}</span>
        </div>
        <nav>
          ${navItems.map((item) => `
            <button class="${state.route === item ? "is-active" : ""}" type="button" data-route="${item}">
              ${icon(item)}<span>${t(`nav.${item}`)}</span>
            </button>
          `).join("")}
        </nav>
        <div class="mini-profile">
          <span>${state.user?.email || t("common.guest")}</span>
          <small>${t("common.premium")} · ${t("common.local")}</small>
          <button type="button" data-logout>${t("nav.logout")}</button>
        </div>
      </aside>
      <section class="main-stage">
        ${renderTopbar()}
        ${renderRoute()}
      </section>
    </main>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${t("brand.tagline")}</p>
        <h1>${routeTitle()}</h1>
      </div>
      <div class="top-actions">
        <select data-language-switch aria-label="${t("settings.language")}">
          ${Object.keys(dictionaries).map((lang) => `<option value="${lang}" ${state.lang === lang ? "selected" : ""}>${dictionaries[lang].meta.langName}</option>`).join("")}
        </select>
        <div class="theme-pills">
          ${themes.map((theme) => `<button class="${state.theme === theme ? "is-active" : ""}" type="button" data-theme="${theme}">${t(`settings.${theme}`)}</button>`).join("")}
        </div>
      </div>
    </header>
  `;
}

function routeTitle() {
  if (state.route === "home") return t("home.greeting");
  if (state.route === "conversations") return t("reply.title");
  return t(`${state.route}.title`);
}

function renderRoute() {
  if (state.route === "home") return renderHome();
  if (state.route === "conversations") return renderConversationTool();
  if (state.route === "schedule") return renderScheduleTool();
  if (state.route === "insights") return renderInsightsTool();
  if (state.route === "mood") return renderMood();
  return renderSettings();
}

function renderHome() {
  return `
    <section class="home-grid view-enter">
      <article class="hero-panel">
        <div class="ondo-field" aria-hidden="true">
          <span>ONDO</span>
        </div>
        <div class="hero-content">
          <span>${t("brand.tagline")}</span>
          <h2>${t("home.headline")}</h2>
          <p>${t("home.status")}</p>
          <div class="hero-actions">
            <button class="primary-action" type="button" data-route="conversations">${t("home.primary")}</button>
            <button class="ghost-action" type="button" data-route="schedule">${t("home.secondary")}</button>
          </div>
        </div>
        ${renderHeroPreview()}
      </article>
      <section class="metric-grid">
        ${metric(t("home.socialLoad"), 42)}
        ${metric(t("home.warmth"), 84)}
        ${metric(t("home.clarity"), 78)}
        ${metric(t("home.scheduleFit"), 91)}
      </section>
      <article class="panel story-panel">
        <span class="section-kicker">01</span>
        <h3>${t("home.problemTitle")}</h3>
        <p>${t("home.problemBody")}</p>
      </article>
      <article class="panel story-panel">
        <span class="section-kicker">02</span>
        <h3>${t("home.understandingTitle")}</h3>
        <p>${t("home.understandingBody")}</p>
      </article>
      <article class="panel wide usage-panel">
        <div class="section-heading">
          <span class="section-kicker">03</span>
          <h3>${t("home.usageTitle")}</h3>
        </div>
        ${renderUsageExamples()}
      </article>
      <article class="panel">
        <h3>${t("home.next")}</h3>
        ${timeline([t("home.reminder1"), t("home.reminder2"), t("home.reminder3")])}
      </article>
      <article class="panel trust-panel">
        <span class="section-kicker">04</span>
        <h3>${t("home.trustTitle")}</h3>
        <p>${t("home.trustBody")}</p>
        <div class="trust-list">
          <span>${t("auth.secure")}</span>
          <span>${t("settings.privacy")}</span>
        </div>
      </article>
      <article class="panel wide cta-panel">
        <div>
          <span class="section-kicker">05</span>
          <h3>${t("home.ctaTitle")}</h3>
          <p>${t("home.ctaBody")}</p>
        </div>
        <button class="primary-action" type="button" data-route="conversations">${t("home.primary")}</button>
      </article>
    </section>
  `;
}

function renderHeroPreview() {
  return `
    <div class="hero-preview" aria-hidden="true">
      <div class="preview-message incoming">${state.lang === "ko" ? "오늘 약속 조금 미뤄도 괜찮을까?" : "Could we move today’s plan a little?"}</div>
      <div class="preview-message outgoing">${state.lang === "ko" ? "물론이야. 편한 시간 알려줘." : "Of course. Tell me what time works."}</div>
      <div class="preview-chip">${state.lang === "ko" ? "차분한 답장 추천" : "Calm reply suggested"}</div>
    </div>
  `;
}

function renderUsageExamples() {
  const reply = state.lang === "ko"
    ? "미안해. 오늘은 어렵고, 화요일 저녁이나 수요일 점심은 괜찮아."
    : "Sorry, today is difficult. Tuesday evening or Wednesday lunch works.";
  const summary = state.lang === "ko"
    ? ["장소는 강남 선호", "예산은 1인 3만원", "예약 후 주소 공유"]
    : ["Gangnam preferred", "Budget under $30", "Share address after booking"];
  const schedule = state.lang === "ko" ? "토요일 · 오후 3시" : "Saturday · 3 PM";

  return `
    <div class="usage-grid">
      <div class="usage-card">
        <strong>${t("reply.title")}</strong>
        <div class="mini-chat">
          <span>${reply}</span>
        </div>
      </div>
      <div class="usage-card">
        <strong>${t("summary.title")}</strong>
        <ul>${summary.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="usage-card">
        <strong>${t("schedule.title")}</strong>
        <div class="mini-calendar">
          <span>${schedule}</span>
          <small>${state.lang === "ko" ? "추천도 88%" : "88% fit"}</small>
        </div>
      </div>
    </div>
  `;
}

function renderConversationTool() {
  return `
    <section class="tool-layout view-enter">
      <article class="panel input-panel">
        <h2>${t("reply.title")}</h2>
        <p>${t("reply.desc")}</p>
        <textarea id="reply-input" placeholder="${t("reply.placeholder")}"></textarea>
        <div class="tone-grid">
          ${toneKeys.map((key) => `<button type="button" data-tone="${key}" class="${key === "soft" ? "is-active" : ""}">${t(`reply.tones.${key}`)}</button>`).join("")}
        </div>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="reply">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="reply">${t("common.refine")}</button>
        </div>
      </article>
      <article class="panel result-panel" id="reply-result">
        <h3>${t("reply.output")}</h3>
        ${renderReplyCards(t("samples.reply"))}
      </article>
      <article class="panel input-panel wide">
        <h2>${t("summary.title")}</h2>
        <p>${t("summary.desc")}</p>
        <textarea id="summary-input" placeholder="${t("summary.placeholder")}"></textarea>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="summary">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="summary">${t("common.analyze")}</button>
        </div>
      </article>
      <article class="panel result-panel wide" id="summary-result">
        ${renderSummary(t("samples.summary"))}
      </article>
    </section>
  `;
}

function renderScheduleTool() {
  return `
    <section class="tool-layout view-enter">
      <article class="panel input-panel wide">
        <h2>${t("schedule.title")}</h2>
        <p>${t("schedule.desc")}</p>
        <textarea id="schedule-input" placeholder="${t("schedule.placeholder")}"></textarea>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="schedule">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="schedule">${t("common.generate")}</button>
        </div>
      </article>
      <article class="panel schedule-board wide" id="schedule-result">
        ${renderSchedule(t("samples.schedule"))}
      </article>
    </section>
  `;
}

function renderInsightsTool() {
  return `
    <section class="tool-layout view-enter">
      <article class="panel input-panel">
        <h2>${t("insights.title")}</h2>
        <p>${t("insights.desc")}</p>
        <textarea id="insight-input" placeholder="${t("samples.insight")}"></textarea>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="insight">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="insight">${t("common.analyze")}</button>
        </div>
      </article>
      <article class="panel result-panel" id="insight-result">
        ${renderInsights(t("samples.insight"))}
      </article>
    </section>
  `;
}

function renderMood() {
  const moods = ["calm", "bright", "tired", "tender", "focus"];
  return `
    <section class="mood-grid view-enter">
      <article class="panel">
        <h2>${t("mood.title")}</h2>
        <p>${t("mood.desc")}</p>
        <div class="mood-selector">
          ${moods.map((mood) => `<button type="button" class="${state.mood === mood ? "is-active" : ""}" data-mood="${mood}">${t(`mood.${mood}`)}</button>`).join("")}
        </div>
      </article>
      <article class="panel mood-orbit">
        <div class="temperature-ring large"><span>${moodTemperature()}°</span></div>
        <h3>${t(`mood.${state.mood}`)}</h3>
      </article>
      <article class="panel wide">
        <h3>${t("mood.log")}</h3>
        ${timeline([t("home.status"), t("home.reminder2"), t("home.reminder3")])}
      </article>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="settings-grid view-enter">
      <article class="panel">
        <h2>${t("settings.language")}</h2>
        <div class="settings-list">
          ${Object.keys(dictionaries).map((lang) => `<button type="button" data-lang-set="${lang}" class="${state.lang === lang ? "is-active" : ""}">${dictionaries[lang].meta.langName}</button>`).join("")}
        </div>
      </article>
      <article class="panel">
        <h2>${t("settings.theme")}</h2>
        <div class="settings-list">
          ${themes.map((theme) => `<button type="button" data-theme="${theme}" class="${state.theme === theme ? "is-active" : ""}">${t(`settings.${theme}`)}</button>`).join("")}
        </div>
      </article>
      <article class="panel wide">
        <h2>${t("settings.privacy")}</h2>
        <p>${t("settings.privacyBody")}</p>
        <p>${t("settings.env")}</p>
      </article>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    saveSession();
    render();
  }));

  app.querySelector("#auth-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = sanitize(form.get("email"));
    const password = sanitize(form.get("password"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      event.currentTarget.classList.add("has-error");
      return;
    }
    state.authed = true;
    state.user = { email };
    saveSession();
    render();
  });

  app.querySelector("[data-guest]")?.addEventListener("click", () => {
    state.authed = true;
    state.user = { email: t("common.guest") };
    saveSession();
    render();
  });

  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
    state.route = button.dataset.route;
    saveSession();
    render();
  }));

  app.querySelector("[data-logout]")?.addEventListener("click", () => {
    state.authed = false;
    state.user = null;
    saveSession();
    render();
  });

  app.querySelector("[data-language-switch]")?.addEventListener("change", (event) => {
    state.lang = event.target.value;
    saveSession();
    render();
  });

  app.querySelectorAll("[data-lang-set]").forEach((button) => button.addEventListener("click", () => {
    state.lang = button.dataset.langSet;
    saveSession();
    render();
  }));

  app.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", () => {
    state.theme = button.dataset.theme;
    saveSession();
    render();
  }));

  app.querySelectorAll("[data-mood]").forEach((button) => button.addEventListener("click", () => {
    state.mood = button.dataset.mood;
    saveSession();
    render();
  }));

  app.querySelectorAll("[data-tone]").forEach((button) => button.addEventListener("click", () => {
    app.querySelectorAll("[data-tone]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    runReply();
  }));

  app.querySelectorAll("[data-sample]").forEach((button) => button.addEventListener("click", () => {
    const type = button.dataset.sample;
    const target = app.querySelector(`#${type}-input`);
    if (target) target.value = t(`samples.${type}`);
  }));

  app.querySelectorAll("[data-run]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.run === "reply") runReply();
    if (button.dataset.run === "summary") runSummary();
    if (button.dataset.run === "schedule") runSchedule();
    if (button.dataset.run === "insight") runInsight();
  }));

  app.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    const text = app.querySelector(button.dataset.copy)?.innerText || "";
    await navigator.clipboard.writeText(text.trim());
    button.textContent = t("common.copied");
    setTimeout(() => { button.textContent = t("common.copy"); }, 1200);
  }));
}

function runReply() {
  const text = sanitize(app.querySelector("#reply-input")?.value || t("samples.reply"));
  app.querySelector("#reply-result").innerHTML = `<h3>${t("reply.output")}</h3>${renderReplyCards(text)}`;
  bindEvents();
}

function runSummary() {
  const text = sanitize(app.querySelector("#summary-input")?.value || t("samples.summary"));
  app.querySelector("#summary-result").innerHTML = renderSummary(text);
  bindEvents();
}

function runSchedule() {
  const text = sanitize(app.querySelector("#schedule-input")?.value || t("samples.schedule"));
  app.querySelector("#schedule-result").innerHTML = renderSchedule(text);
}

function runInsight() {
  const text = sanitize(app.querySelector("#insight-input")?.value || t("samples.insight"));
  app.querySelector("#insight-result").innerHTML = renderInsights(text);
}

function renderReplyCards(text) {
  const activeTone = app.querySelector("[data-tone].is-active")?.dataset.tone || "soft";
  const base = text.replace(/\s+/g, " ").trim();
  const prefix = {
    ko: {
      soft: "부담 주고 싶지는 않지만",
      natural: "상황이 조금 바뀌어서",
      professional: "일정 관련해 조정 요청드립니다.",
      romantic: "네가 불편하지 않았으면 해서 조심스럽게 말할게.",
      cute: "나 살짝 부탁이 있어.",
      calm: "천천히 이야기해도 괜찮아.",
      concise: "일정 조정 가능할까?",
    },
    en: {
      soft: "I do not want to make this feel heavy, but",
      natural: "Something shifted on my side, so",
      professional: "I would like to request a schedule adjustment.",
      romantic: "I want to say this gently because I care about how it feels.",
      cute: "Small favor, if that is okay.",
      calm: "No rush, but I wanted to share this clearly.",
      concise: "Could we adjust the plan?",
    },
  };
  const lang = state.lang || "ko";
  const versions = [activeTone, "calm", "concise"].filter((value, index, arr) => arr.indexOf(value) === index);
  return `
    <div class="response-stack">
      ${versions.map((tone, index) => `
        <div class="response-card" style="--delay:${index * 80}ms">
          <span>${t(`reply.tones.${tone}`)}</span>
          <p>${escapeHtml(`${prefix[lang][tone]} ${base}`)}</p>
          <button type="button" data-copy="#reply-result">${t("common.copy")}</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSummary(text) {
  const lines = splitLines(text);
  const plans = findLines(lines, ["예약", "약속", "plan", "book", "Friday", "Saturday", "금요일", "토요일", "7"]);
  const decisions = findLines(lines, ["좋", "정", "확정", "Sounds", "decide", "budget", "예산"]);
  const unresolved = findLines(lines, ["?", "어때", "가능", "could", "should", "if"]);
  return `
    <h3>${t("summary.title")}</h3>
    <div class="insight-grid">
      ${insightCard(t("summary.topics"), lines.slice(0, 3).map(stripSpeaker))}
      ${insightCard(t("summary.promises"), plans.map(stripSpeaker))}
      ${insightCard(t("summary.tone"), [state.lang === "ko" ? "협조적이고 실용적인 분위기" : "Collaborative and practical atmosphere"])}
      ${insightCard(t("summary.unresolved"), unresolved.map(stripSpeaker))}
      ${insightCard(t("summary.decisions"), decisions.map(stripSpeaker))}
      ${insightCard(t("summary.nextReply"), [state.lang === "ko" ? "좋아, 그럼 가능한 시간 기준으로 예약 후보를 2곳만 추려볼게." : "Great, I will shortlist two places based on the available time."])}
    </div>
    <button class="copy-mini" type="button" data-copy="#summary-result">${t("common.copy")}</button>
  `;
}

function renderSchedule(text) {
  const analysis = analyzeSchedule(text);
  const bestCandidate = analysis.candidates[0];
  const best = bestCandidate?.label || (state.lang === "ko" ? "후보 정보 부족" : "Not enough schedule signals");
  const confidence = bestCandidate ? Math.min(96, Math.max(54, 56 + bestCandidate.score * 7 + bestCandidate.supporters.length * 4)) : 42;
  const indoor = /비|rain|indoor/i.test(text);
  const atmosphere = detectAtmosphere(text);
  const categories = indoor
    ? (state.lang === "ko" ? "라운지 카페, 조용한 식당, 실내 브런치" : "Lounge cafe, quiet restaurant, indoor brunch")
    : (state.lang === "ko" ? "조용한 카페, 캐주얼 다이닝, 가벼운 라운지" : "Quiet cafe, casual dining, relaxed lounge");
  const reasonItems = bestCandidate?.reasons.length
    ? bestCandidate.reasons
    : [state.lang === "ko" ? "가능/불가능 표현이 충분하지 않아 추가 확인이 필요합니다." : "Availability signals are not strong enough yet."];
  const riskItems = analysis.risks.length
    ? analysis.risks
    : [state.lang === "ko" ? "뚜렷한 충돌 표현은 적습니다." : "No strong conflict signals found."];

  return `
    <h3>${t("schedule.bestTime")}</h3>
    <div class="calendar-card">
      <div><span>${escapeHtml(best)}</span><strong>${Math.round(confidence)}%</strong></div>
      <p>${state.lang === "ko" ? "대화의 가능 표현, 선호 표현, 충돌 표현을 점수화해 가장 설득력 있는 후보를 골랐습니다." : "ONDO scored positive, preferred, and conflicting signals to recommend the strongest option."}</p>
    </div>
    <div class="schedule-grid">
      ${insightCard(state.lang === "ko" ? "추천 근거" : "Why this works", reasonItems)}
      ${insightCard(state.lang === "ko" ? "확인 필요" : "Needs confirmation", riskItems)}
      ${insightCard(t("schedule.atmosphere"), [atmosphere])}
      ${insightCard(t("schedule.categories"), [categories])}
      ${insightCard(t("schedule.budget"), [detectBudget(text)])}
      ${insightCard(t("schedule.weather"), [indoor ? (state.lang === "ko" ? "비 가능성 때문에 실내 우선" : "Prioritize indoor options due to rain") : (state.lang === "ko" ? "날씨 변수 낮음" : "Low weather risk")])}
    </div>
  `;
}

function analyzeSchedule(text) {
  const candidates = new Map();
  const risks = [];
  const lines = splitLines(text);

  lines.forEach((line) => {
    const speaker = line.match(/^([^:：]{1,16})[:：]/)?.[1]?.trim();
    splitScheduleSegments(stripSpeaker(line)).forEach((segment) => {
      const dates = matches(segment, scheduleDateRegex());
      const times = matches(segment, scheduleTimeRegex()).map(normalizeTime);
      const score = scoreScheduleSegment(segment);
      const sentiment = segmentSentiment(segment);
      const labels = buildScheduleLabels(dates, times);

      if (sentiment === "negative" && (dates.length || times.length)) {
        risks.push(`${speaker ? `${speaker}: ` : ""}${segment}`);
      }

      labels.forEach((label) => {
        const current = candidates.get(label) || {
          label,
          score: 0,
          supporters: [],
          blockers: [],
          reasons: [],
        };

        current.score += score;
        if (sentiment === "negative") current.blockers.push(speaker || segment);
        if (sentiment !== "negative") current.supporters.push(speaker || segment);
        candidates.set(label, current);
      });
    });
  });

  const sorted = [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      reasons: buildScheduleReasons(candidate),
    }))
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff) return scoreDiff;
      const supportDiff = b.supporters.length - a.supporters.length;
      if (supportDiff) return supportDiff;
      return a.blockers.length - b.blockers.length;
    });

  return { candidates: sorted, risks: [...new Set(risks)].slice(0, 4) };
}

function splitScheduleSegments(line) {
  return line
    .replace(/늦고/g, "늦고,")
    .replace(/어렵고/g, "어렵고,")
    .replace(/힘들고/g, "힘들고,")
    .split(/[,.;!?。！？]|하지만|근데|그런데|다만|\s+but\s+|\s+however\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function scheduleDateRegex() {
  return /(오늘|내일|모레|월요일|화요일|수요일|목요일|금요일|토요일|일요일|이번 주|다음 주|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|today|tomorrow)/gi;
}

function scheduleTimeRegex() {
  return /((오전|오후|저녁|낮|밤)\s*)?([0-9]{1,2}\s*시(\s*[0-9]{1,2}\s*분)?|[0-9]{1,2}:[0-9]{2}|[0-9]{1,2}\s?(PM|AM))/gi;
}

function buildScheduleLabels(dates, times) {
  if (!dates.length && !times.length) return [];
  if (!dates.length) return times.map((time) => `${state.lang === "ko" ? "날짜 확인 필요" : "Date TBD"} · ${time}`);
  if (!times.length) return dates.map((date) => `${date} · ${state.lang === "ko" ? "시간 확인 필요" : "Time TBD"}`);
  return dates.flatMap((date) => times.map((time) => `${date} · ${time}`));
}

function segmentSentiment(segment) {
  if (/불가|어려|힘들|안\s?돼|안되|못|늦|무리|busy|can't|cannot|unavailable|hard|difficult|late/i.test(segment)) {
    return "negative";
  }
  if (/가능|좋|선호|괜찮|편|추천|works|prefer|free|available|good|better|best/i.test(segment)) {
    return "positive";
  }
  return "neutral";
}

function scoreScheduleSegment(segment) {
  let score = 1;
  if (/가능|괜찮|free|available|works/i.test(segment)) score += 3;
  if (/좋|선호|편|추천|prefer|better|best|good/i.test(segment)) score += 2;
  if (/정확히|exactly|confirmed|확정/i.test(segment)) score += 1;
  if (/불가|어려|힘들|안\s?돼|안되|못|늦|무리|busy|can't|cannot|unavailable|late/i.test(segment)) score -= 5;
  if (/조용|quiet|실내|indoor|예산|budget|비|rain/i.test(segment)) score += 1;
  return score;
}

function buildScheduleReasons(candidate) {
  const supporters = [...new Set(candidate.supporters)].filter(Boolean);
  const blockers = [...new Set(candidate.blockers)].filter(Boolean);
  const reasons = [];

  if (supporters.length) {
    reasons.push(state.lang === "ko"
      ? `${supporters.slice(0, 3).join(", ")} 쪽에서 긍정 신호가 있습니다.`
      : `Positive signals from ${supporters.slice(0, 3).join(", ")}.`);
  }
  if (candidate.score >= 5) {
    reasons.push(state.lang === "ko" ? "가능/선호 표현이 여러 번 겹칩니다." : "Availability and preference signals overlap.");
  }
  if (blockers.length) {
    reasons.push(state.lang === "ko"
      ? `${blockers.slice(0, 2).join(", ")} 관련 충돌은 확인이 필요합니다.`
      : `Check possible conflicts around ${blockers.slice(0, 2).join(", ")}.`);
  }

  return reasons;
}

function normalizeTime(time) {
  return time.replace(/\s+/g, " ").trim().replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

function detectAtmosphere(text) {
  if (/조용|quiet/i.test(text)) return state.lang === "ko" ? "조용한 대화, 낮은 소음, 여유 있는 좌석" : "Quiet conversation, low noise, relaxed seating";
  if (/로맨틱|romantic|date/i.test(text)) return state.lang === "ko" ? "부드러운 조명, 오래 머물기 좋은 분위기" : "Soft lighting and an unhurried atmosphere";
  if (/가볍|casual|친구/i.test(text)) return state.lang === "ko" ? "캐주얼하고 부담 없는 분위기" : "Casual, easy, low-pressure atmosphere";
  return state.lang === "ko" ? "차분하고 대화하기 좋은 분위기" : "Calm, conversation-friendly atmosphere";
}

function detectBudget(text) {
  const budget = text.match(/([0-9]{1,3})\s?만\s?원|[$₩]?\s?([0-9]{2,4})\s?(달러|원|won|dollars)?/i);
  if (!budget) return state.lang === "ko" ? "예산 정보가 없어서 중간 가격대를 추천합니다." : "No clear budget found, so recommend a mid-range option.";
  return state.lang === "ko" ? `대화에 나온 예산 ${budget[0]} 기준으로 맞춥니다.` : `Use the mentioned budget signal: ${budget[0]}.`;
}

function renderInsights(text) {
  const stress = /서운|부담|pressure|hurt|late|늦/i.test(text) ? 68 : 38;
  return `
    <h3>${t("insights.title")}</h3>
    <div class="metric-grid compact">
      ${metric(t("insights.warmth"), 74)}
      ${metric(t("insights.tension"), stress)}
      ${metric(t("insights.energy"), 63)}
      ${metric(t("insights.stress"), stress)}
    </div>
    <div class="soft-note">
      <strong>${t("insights.notes")}</strong>
      <p>${state.lang === "ko" ? "상대에게 부담을 주지 않으려는 배려와, 먼저 연락하는 패턴에서 오는 피로가 함께 보입니다. 요청은 짧고 따뜻하게, 감정은 한 문장만 드러내는 편이 좋습니다." : "There is care around not pressuring the other person, mixed with fatigue from initiating often. Keep the request warm and brief, and name the feeling in one sentence."}</p>
    </div>
  `;
}

function metric(label, value) {
  return `
    <article class="metric-card">
      <div class="metric-top"><span>${label}</span><strong>${value}</strong></div>
      <div class="meter"><i style="width:${value}%"></i></div>
    </article>
  `;
}

function insightCard(title, items) {
  const safeItems = items.length ? items : [state.lang === "ko" ? "추가 정보가 필요합니다." : "More context needed."];
  return `<div class="insight-card"><strong>${title}</strong><ul>${safeItems.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function timeline(items) {
  return `<div class="timeline">${items.map((item) => `<div><i></i><p>${escapeHtml(item)}</p></div>`).join("")}</div>`;
}

function icon(item) {
  const icons = { home: "⌂", conversations: "✎", schedule: "◷", insights: "◇", mood: "◌", settings: "⚙" };
  return `<i aria-hidden="true">${icons[item]}</i>`;
}

function moodTemperature() {
  return { calm: "23.8", bright: "26.4", tired: "20.9", tender: "25.1", focus: "22.7" }[state.mood];
}

function sanitize(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function splitLines(text) {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function findLines(lines, keys) {
  return lines.filter((line) => keys.some((key) => line.toLowerCase().includes(String(key).toLowerCase()))).slice(0, 4);
}

function stripSpeaker(line) {
  return line.replace(/^([^:：]{1,12})[:：]\s*/, "");
}

function matches(text, regex) {
  return [...new Set((text.match(regex) || []).map((item) => item.trim()))];
}
