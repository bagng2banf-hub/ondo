import { dictionaries } from "./i18n.js";

const STORAGE_KEY = "ondo.session.v2";
const AVAILABILITY_KEY = "ondo.availability.v1";
const app = document.querySelector("#app");

const navItems = ["conversations", "relationships", "planning", "insights", "settings"];
const themes = ["light", "dark", "warm"];
const toneKeys = ["friendly", "casual", "professional", "romantic", "supportive", "honest", "direct"];
const days = ["월", "화", "수", "목", "금", "토", "일"];
const times = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const state = loadSession();
let availability = loadAvailability();

render();

function loadSession() {
  const fallback = { lang: "ko", authed: false, user: null, theme: "light", route: "conversations" };
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    return { ...fallback, ...saved, lang: saved.lang || "ko" };
  } catch {
    return fallback;
  }
}

function loadAvailability() {
  try {
    return JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSession() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAvailability() {
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(availability));
}

function t(path) {
  const dict = dictionaries[state.lang || "ko"];
  return path.split(".").reduce((obj, key) => obj?.[key], dict) ?? path;
}

function render() {
  document.documentElement.lang = state.lang || "ko";
  document.body.dataset.theme = state.theme;
  if (!navItems.includes(state.route)) state.route = "conversations";
  app.innerHTML = state.authed ? renderShell() : renderAuthScreen();
  bindEvents();
}

function renderAuthScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-hero">
        <div class="brand-lockup">
          <span class="logo-mark">O</span>
          <span>${t("brand.name")}</span>
        </div>
        <div class="auth-copy">
          <p class="eyebrow">${t("landing.eyebrow")}</p>
          <h1>${t("landing.title")}</h1>
          <p>${t("landing.body")}</p>
          <div class="landing-actions">
            <button class="primary-action" type="button" data-guest>${t("landing.cta")}</button>
            <span>${t("landing.note")}</span>
          </div>
          <div class="feature-pills">
            <span>${t("landing.reply")}</span>
            <span>${t("landing.summary")}</span>
            <span>${t("landing.plan")}</span>
            <span>${t("landing.insight")}</span>
          </div>
        </div>
        <div class="daily-stack" aria-label="ONDO preview">
          ${dailyItem(t("landing.previewTitle"), t("landing.previewReply"))}
          ${dailyItem(t("dashboard.plan"), t("landing.previewPlan"))}
          ${dailyItem(t("dashboard.relationship"), t("landing.previewMood"))}
        </div>
      </section>
      <section class="auth-card">
        <div class="mobile-brand">
          <span class="logo-mark">O</span>
          <strong>${t("brand.name")}</strong>
        </div>
        <form id="auth-form" novalidate>
          <label>${t("auth.email")}<input name="email" type="email" autocomplete="email" required placeholder="you@ondo.app"></label>
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
        <nav aria-label="Main navigation">
          ${navItems.map((item) => `
            <button class="${state.route === item ? "is-active" : ""}" type="button" data-route="${item}">
              ${icon(item)}<span>${t(`nav.${item}`)}</span>
            </button>
          `).join("")}
        </nav>
        <div class="mini-profile">
          <span>${state.user?.email || t("common.guest")}</span>
          <small>${t("common.local")}</small>
          <button type="button" data-logout>${t("nav.logout")}</button>
        </div>
      </aside>
      <section class="main-stage">
        ${renderTopbar()}
        ${renderDashboardStrip()}
        ${renderRoute()}
      </section>
    </main>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${t("brand.subline")}</p>
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

function renderDashboardStrip() {
  return `
    <section class="dashboard-strip">
      ${dailyItem(t("dashboard.nextReply"), t("dashboard.nextReplyBody"), "conversations")}
      ${dailyItem(t("dashboard.plan"), t("dashboard.planBody"), "planning")}
      ${dailyItem(t("dashboard.relationship"), t("dashboard.relationshipBody"), "relationships")}
    </section>
  `;
}

function dailyItem(title, body, route = "") {
  return `
    <article class="daily-item" ${route ? `data-route="${route}"` : ""}>
      <strong>${title}</strong>
      <p>${body}</p>
    </article>
  `;
}

function routeTitle() {
  if (state.route === "conversations") return t("reply.title");
  if (state.route === "relationships") return t("relationships.title");
  if (state.route === "planning") return t("schedule.title");
  if (state.route === "insights") return t("insights.title");
  return t("settings.title");
}

function renderRoute() {
  if (state.route === "conversations") return renderConversationTool();
  if (state.route === "relationships") return renderRelationshipsTool();
  if (state.route === "planning") return renderPlanningTool();
  if (state.route === "insights") return renderInsightsTool();
  return renderSettings();
}

function renderConversationTool() {
  return `
    <section class="work-grid view-enter">
      <article class="panel input-panel">
        <span class="section-kicker">${state.lang === "ko" ? "답장" : "Reply"}</span>
        <h2>${t("reply.desc")}</h2>
        <textarea id="reply-input" placeholder="${t("reply.placeholder")}"></textarea>
        <div class="tone-grid">
          ${toneKeys.map((key) => `<button type="button" data-tone="${key}" class="${key === "friendly" ? "is-active" : ""}">${t(`reply.tones.${key}`)}</button>`).join("")}
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
      <article class="panel input-panel">
        <span class="section-kicker">${state.lang === "ko" ? "요약" : "Summary"}</span>
        <h2>${t("summary.desc")}</h2>
        <textarea id="summary-input" placeholder="${t("summary.placeholder")}"></textarea>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="summary">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="summary">${t("common.analyze")}</button>
        </div>
      </article>
      <article class="panel result-panel" id="summary-result">
        ${renderSummary(t("samples.summary"))}
      </article>
    </section>
  `;
}

function renderRelationshipsTool() {
  return `
    <section class="product-page view-enter">
      <article class="panel wide page-intro">
        <span class="section-kicker">${t("relationships.title")}</span>
        <h2>${t("relationships.body")}</h2>
      </article>
      <div class="relationship-grid">
        ${statementCard(t("relationships.frequency"), t("relationships.frequencyBody"))}
        ${statementCard(t("relationships.trend"), t("relationships.trendBody"))}
        ${statementCard(t("relationships.pattern"), t("relationships.patternBody"))}
      </div>
      <article class="panel wide">
        <div class="section-heading">
          <span class="section-kicker">${state.lang === "ko" ? "기록" : "Timeline"}</span>
          <h3>${t("relationships.timeline")}</h3>
        </div>
        ${timeline([t("relationships.timeline1"), t("relationships.timeline2"), t("relationships.timeline3"), t("relationships.timeline4")])}
      </article>
    </section>
  `;
}

function renderPlanningTool() {
  return `
    <section class="product-page view-enter">
      <article class="panel wide page-intro">
        <span class="section-kicker">${t("schedule.title")}</span>
        <h2>${t("schedule.desc")}</h2>
      </article>
      <article class="panel availability-panel wide">
        <div class="section-heading split">
          <div>
            <span class="section-kicker">${t("common.local")}</span>
            <h3>${t("schedule.calendarTitle")}</h3>
            <p>${t("schedule.calendarDesc")}</p>
          </div>
          <button class="secondary-action" type="button" data-clear-availability>${t("common.clear")}</button>
        </div>
        ${renderAvailabilityCalendar()}
        ${renderAvailabilityRecommendation()}
      </article>
      <article class="panel input-panel wide">
        <h2>${t("schedule.input")}</h2>
        <p>${t("schedule.placeholder")}</p>
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
    <section class="product-page view-enter">
      <article class="panel wide page-intro">
        <span class="section-kicker">${t("insights.title")}</span>
        <h2>${t("insights.desc")}</h2>
      </article>
      <div class="relationship-grid">
        ${statementCard(t("insights.balance"), t("insights.balanceBody"))}
        ${statementCard(t("insights.fatigue"), t("insights.fatigueBody"))}
        ${statementCard(t("insights.topics"), t("insights.topicsBody"))}
      </div>
      <article class="panel input-panel wide">
        <h2>${t("insights.notes")}</h2>
        <textarea id="insight-input" placeholder="${t("samples.insight")}"></textarea>
        <div class="control-row">
          <button class="secondary-action" type="button" data-sample="insight">${t("common.example")}</button>
          <button class="primary-action" type="button" data-run="insight">${t("common.analyze")}</button>
        </div>
      </article>
      <article class="panel result-panel wide" id="insight-result">
        ${renderInsights(t("samples.insight"))}
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

function renderAvailabilityCalendar() {
  return `
    <div class="availability-calendar" role="grid" aria-label="${t("schedule.calendarTitle")}">
      <div class="calendar-corner"></div>
      ${days.map((day) => `<div class="calendar-head">${localizedDay(day)}</div>`).join("")}
      ${times.map((time) => `
        <div class="time-head">${time}</div>
        ${days.map((day) => {
          const key = `${day}-${time}`;
          const active = Boolean(availability[key]);
          return `<button type="button" class="time-slot ${active ? "is-active" : ""}" data-slot="${key}" aria-pressed="${active}">${active ? t("schedule.available") : t("schedule.unavailable")}</button>`;
        }).join("")}
      `).join("")}
    </div>
  `;
}

function renderAvailabilityRecommendation() {
  const slots = Object.keys(availability).filter((key) => availability[key]);
  const preferred = slots.filter((slot) => /토|일|18:00|20:00/.test(slot));
  const list = (preferred.length ? preferred : slots).slice(0, 3);
  return `
    <div class="availability-summary">
      <strong>${t("schedule.recommendation")}</strong>
      <p>${list.length ? list.map(formatSlot).join(" · ") : t("schedule.noSlots")}</p>
    </div>
  `;
}

function bindEvents() {
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

  app.querySelectorAll("[data-slot]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.slot;
    availability[key] = !availability[key];
    if (!availability[key]) delete availability[key];
    saveAvailability();
    render();
  }));

  app.querySelector("[data-clear-availability]")?.addEventListener("click", () => {
    availability = {};
    saveAvailability();
    render();
  });

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
  const activeTone = app.querySelector("[data-tone].is-active")?.dataset.tone || "friendly";
  const base = text.replace(/\s+/g, " ").trim();
  const prefix = {
    ko: {
      friendly: "편하게 말하면,",
      casual: "나 조금 부탁이 있어.",
      professional: "일정 조정과 관련해 말씀드립니다.",
      romantic: "네가 부담스럽지 않았으면 해서 조심스럽게 말할게.",
      supportive: "네 상황도 이해하고 싶어서,",
      honest: "솔직히 말하면,",
      direct: "핵심만 말하면,",
    },
    en: {
      friendly: "To say this comfortably,",
      casual: "Small favor, if that is okay.",
      professional: "I would like to discuss a schedule adjustment.",
      romantic: "I want to say this gently because I care about how it feels.",
      supportive: "I want to understand your side too, so",
      honest: "Honestly,",
      direct: "To be direct,",
    },
  };
  const lang = state.lang || "ko";
  const versions = [activeTone, "supportive", "direct"].filter((value, index, arr) => arr.indexOf(value) === index);
  return `
    <div class="response-stack">
      ${versions.map((tone, index) => `
        <div class="response-card" style="--delay:${index * 70}ms">
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
  const plans = findLines(lines, ["예약", "약속", "plan", "book", "금요일", "토요일", "Friday", "Saturday", "7", "3"]);
  const decisions = findLines(lines, ["좋", "가능", "정", "budget", "예산", "works", "prefer"]);
  const unresolved = findLines(lines, ["?", "어때", "가능", "could", "should", "if"]);
  return `
    <h3>${t("summary.title")}</h3>
    <div class="insight-grid">
      ${insightCard(t("summary.topics"), lines.slice(0, 3).map(stripSpeaker))}
      ${insightCard(t("summary.promises"), plans.map(stripSpeaker))}
      ${insightCard(t("summary.tone"), [state.lang === "ko" ? "실용적이고 조율 중심의 분위기입니다." : "Practical and coordination-focused."])}
      ${insightCard(t("summary.unresolved"), unresolved.map(stripSpeaker))}
      ${insightCard(t("summary.decisions"), decisions.map(stripSpeaker))}
      ${insightCard(t("summary.nextReply"), [state.lang === "ko" ? "좋아, 가능한 시간 기준으로 장소 후보 두 곳만 추려볼게." : "Great, I will shortlist two places based on the available time."])}
    </div>
    <button class="copy-mini" type="button" data-copy="#summary-result">${t("common.copy")}</button>
  `;
}

function renderSchedule(text) {
  const analysis = analyzeSchedule(text);
  const checkedSlots = Object.keys(availability).filter((key) => availability[key]).map(formatSlot);
  const bestCandidate = checkedSlots[0] || analysis.candidates[0]?.label || (state.lang === "ko" ? "추가 정보 필요" : "More context needed");
  const indoor = /비|rain|indoor|실내/i.test(text);
  const atmosphere = detectAtmosphere(text);
  const categories = indoor
    ? (state.lang === "ko" ? "조용한 카페, 실내 브런치, 예약 가능한 라운지" : "Quiet cafe, indoor brunch, reservable lounge")
    : (state.lang === "ko" ? "조용한 카페, 캐주얼 다이닝, 가벼운 라운지" : "Quiet cafe, casual dining, relaxed lounge");
  const reasons = checkedSlots.length
    ? [state.lang === "ko" ? "체크한 가능 시간이 우선 반영됐습니다." : "Checked availability is prioritized.", ...checkedSlots.slice(0, 2)]
    : analysis.candidates[0]?.reasons || [state.lang === "ko" ? "가능 시간이 충분히 겹치는 후보를 더 확인해야 합니다." : "More overlapping availability is needed."];

  return `
    <h3>${t("schedule.bestTime")}</h3>
    <div class="calendar-card">
      <div><span>${escapeHtml(bestCandidate)}</span><strong>${checkedSlots.length ? t("schedule.available") : t("common.local")}</strong></div>
      <p>${state.lang === "ko" ? "대화에서 나온 조건과 직접 체크한 가능 시간을 함께 보고 가장 실행하기 쉬운 후보를 고릅니다." : "ONDO combines conversation signals with manually checked availability to suggest the easiest option."}</p>
    </div>
    <div class="schedule-grid">
      ${insightCard(state.lang === "ko" ? "추천 근거" : "Why this works", reasons)}
      ${insightCard(state.lang === "ko" ? "확인 필요" : "Needs confirmation", analysis.risks)}
      ${insightCard(t("schedule.atmosphere"), [atmosphere])}
      ${insightCard(t("schedule.categories"), [categories])}
      ${insightCard(t("schedule.budget"), [detectBudget(text)])}
      ${insightCard(t("schedule.weather"), [indoor ? (state.lang === "ko" ? "비 가능성이 있어 실내 장소가 더 안정적입니다." : "Indoor options are safer if rain is possible.") : (state.lang === "ko" ? "날씨 제약은 크지 않습니다." : "Weather risk is low.")])}
    </div>
  `;
}

function analyzeSchedule(text) {
  const candidates = new Map();
  const risks = [];
  splitLines(text).forEach((line) => {
    const speaker = line.match(/^([^:]{1,16}):/)?.[1]?.trim();
    splitScheduleSegments(stripSpeaker(line)).forEach((segment) => {
      const dates = matches(segment, scheduleDateRegex());
      const timeMatches = matches(segment, scheduleTimeRegex()).map(normalizeTime);
      const score = scoreScheduleSegment(segment);
      const sentiment = segmentSentiment(segment);
      const labels = buildScheduleLabels(dates, timeMatches);

      if (sentiment === "negative" && (dates.length || timeMatches.length)) {
        risks.push(`${speaker ? `${speaker}: ` : ""}${segment}`);
      }

      labels.forEach((label) => {
        const current = candidates.get(label) || { label, score: 0, supporters: [], blockers: [], reasons: [] };
        current.score += score;
        if (sentiment === "negative") current.blockers.push(speaker || segment);
        if (sentiment !== "negative") current.supporters.push(speaker || segment);
        candidates.set(label, current);
      });
    });
  });

  const sorted = [...candidates.values()]
    .map((candidate) => ({ ...candidate, reasons: buildScheduleReasons(candidate) }))
    .sort((a, b) => b.score - a.score || b.supporters.length - a.supporters.length || a.blockers.length - b.blockers.length);

  return { candidates: sorted, risks: [...new Set(risks)].slice(0, 4) };
}

function renderInsights(text) {
  const hasStress = /서운|부담|늦|pressure|hurt|late|tired/i.test(text);
  return `
    <h3>${t("insights.title")}</h3>
    <div class="relationship-grid single-row">
      ${statementCard(t("insights.balance"), t("insights.balanceBody"))}
      ${statementCard(t("insights.fatigue"), hasStress ? t("insights.fatigueBody") : (state.lang === "ko" ? "큰 피로 신호는 적지만, 답장 길이는 짧게 유지하는 편이 좋습니다." : "Fatigue signals are mild, but shorter replies may still work better."))}
      ${statementCard(t("insights.topics"), t("insights.topicsBody"))}
    </div>
    <div class="soft-note">
      <strong>${t("insights.notes")}</strong>
      <p>${state.lang === "ko" ? "상대에게 부담을 주지 않으려는 배려와, 먼저 연락하는 일이 많아진 피로가 함께 보입니다. 요청은 짧게, 감정은 한 문장만 드러내는 편이 좋습니다." : "There is care around not pressuring the other person, mixed with fatigue from initiating often. Keep the request brief and name the feeling in one sentence."}</p>
    </div>
  `;
}

function statementCard(title, body) {
  return `<article class="statement-card"><strong>${title}</strong><p>${body}</p></article>`;
}

function insightCard(title, items) {
  const safeItems = items.length ? items : [state.lang === "ko" ? "추가 정보가 필요합니다." : "More context needed."];
  return `<div class="insight-card"><strong>${title}</strong><ul>${safeItems.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function timeline(items) {
  return `<div class="timeline">${items.map((item) => `<div><i></i><p>${escapeHtml(item)}</p></div>`).join("")}</div>`;
}

function splitScheduleSegments(line) {
  return line
    .replace(/그리고/g, "그리고,")
    .replace(/하지만/g, "하지만,")
    .split(/[,.;!?\n]|지만|근데|다만|\s+but\s+|\s+however\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function scheduleDateRegex() {
  return /(오늘|내일|모레|월요일|화요일|수요일|목요일|금요일|토요일|일요일|이번 주|다음 주|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|today|tomorrow)/gi;
}

function scheduleTimeRegex() {
  return /((오전|오후|저녁|밤)\s*)?([0-9]{1,2}\s*시(\s*[0-9]{1,2}\s*분)?|[0-9]{1,2}:[0-9]{2}|[0-9]{1,2}\s?(PM|AM))/gi;
}

function buildScheduleLabels(dateMatches, timeMatches) {
  if (!dateMatches.length && !timeMatches.length) return [];
  if (!dateMatches.length) return timeMatches.map((time) => `${state.lang === "ko" ? "날짜 확인 필요" : "Date TBD"} · ${time}`);
  if (!timeMatches.length) return dateMatches.map((date) => `${date} · ${state.lang === "ko" ? "시간 확인 필요" : "Time TBD"}`);
  return dateMatches.flatMap((date) => timeMatches.map((time) => `${date} · ${time}`));
}

function segmentSentiment(segment) {
  if (/불가|어려|힘들|안\s?돼|못|무리|busy|can't|cannot|unavailable|hard|difficult|late/i.test(segment)) return "negative";
  if (/가능|좋|선호|괜찮|추천|works|prefer|free|available|good|better|best/i.test(segment)) return "positive";
  return "neutral";
}

function scoreScheduleSegment(segment) {
  let score = 1;
  if (/가능|괜찮|free|available|works/i.test(segment)) score += 3;
  if (/좋|선호|추천|prefer|better|best|good/i.test(segment)) score += 2;
  if (/확정|exactly|confirmed/i.test(segment)) score += 1;
  if (/불가|어려|힘들|안\s?돼|못|무리|busy|can't|cannot|unavailable|late/i.test(segment)) score -= 5;
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
    reasons.push(state.lang === "ko" ? "가능 시간과 선호 표현이 겹칩니다." : "Availability and preference signals overlap.");
  }
  if (blockers.length) {
    reasons.push(state.lang === "ko"
      ? `${blockers.slice(0, 2).join(", ")} 관련 충돌은 확인이 필요합니다.`
      : `Check possible conflicts around ${blockers.slice(0, 2).join(", ")}.`);
  }
  return reasons;
}

function detectAtmosphere(text) {
  if (/조용|quiet/i.test(text)) return state.lang === "ko" ? "조용히 대화하기 좋은 좌석과 낮은 소음" : "Quiet seating and low noise";
  if (/다정|데이트|romantic|date/i.test(text)) return state.lang === "ko" ? "부드러운 조명과 오래 머물기 좋은 분위기" : "Soft lighting and an unhurried mood";
  if (/가볍|친구|casual/i.test(text)) return state.lang === "ko" ? "캐주얼하고 부담 없는 분위기" : "Casual and low-pressure";
  return state.lang === "ko" ? "차분하고 대화하기 좋은 분위기" : "Calm and conversation-friendly";
}

function detectBudget(text) {
  const budget = text.match(/([0-9]{1,3})\s?만\s?원|[$₩]?\s?([0-9]{2,4})\s?(달러|원|won|dollars)?/i);
  if (!budget) return state.lang === "ko" ? "예산 정보가 없어 중간 가격대를 추천합니다." : "No clear budget found, so recommend a mid-range option.";
  return state.lang === "ko" ? `대화에 나온 예산 ${budget[0]} 기준으로 맞춥니다.` : `Use the mentioned budget: ${budget[0]}.`;
}

function normalizeTime(time) {
  return time.replace(/\s+/g, " ").trim().replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

function localizedDay(day) {
  if (state.lang === "ko") return day;
  return { 월: "Mon", 화: "Tue", 수: "Wed", 목: "Thu", 금: "Fri", 토: "Sat", 일: "Sun" }[day];
}

function formatSlot(slot) {
  const [day, time] = slot.split("-");
  return `${localizedDay(day)} ${time}`;
}

function icon(item) {
  const icons = { conversations: "✎", relationships: "◎", planning: "◷", insights: "◇", settings: "⚙" };
  return `<i aria-hidden="true">${icons[item]}</i>`;
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
  return line.replace(/^([^:]{1,16}):\s*/, "");
}

function matches(text, regex) {
  return [...new Set((text.match(regex) || []).map((item) => item.trim()))];
}
