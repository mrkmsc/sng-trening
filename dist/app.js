"use strict";

document.documentElement.classList.add("js");

const metrikaId = window.SNG_CONFIG?.metrikaId;
if (Number.isSafeInteger(metrikaId) && metrikaId > 0) {
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.append(tag);
  window.ym(metrikaId, "init", { clickmap: true, trackLinks: true });
}

function reachGoal(name) {
  if (metrikaId && typeof window.ym === "function") {
    window.ym(metrikaId, "reachGoal", name);
  }
}

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#main-nav");
const header = document.querySelector(".site-header");
const narrow = window.matchMedia("(max-width: 800px)");

function setMenu(open, returnFocus = false) {
  const mobile = narrow.matches;
  nav.hidden = mobile && !open;
  toggle.setAttribute("aria-expanded", String(mobile && open));
  if (returnFocus) toggle.focus();
}

setMenu(false);
narrow.addEventListener("change", () => setMenu(false));
toggle.addEventListener("click", () => setMenu(nav.hidden));
nav.addEventListener("click", (event) => {
  if (narrow.matches && event.target.closest("a")) setMenu(false);
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target) && narrow.matches) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && narrow.matches && !nav.hidden) setMenu(false, true);
});

const directions = document.querySelector("[data-directions]");
const tabs = [...directions.querySelectorAll(".tab-list a")];
const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
directions.querySelector(".tab-list").setAttribute("role", "tablist");
tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", panels[index].id);
  panels[index].setAttribute("role", "tabpanel");
  panels[index].setAttribute("aria-labelledby", tab.id);
  panels[index].tabIndex = 0;
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    selectTab(index);
  });
  tab.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      selectTab(index);
      return;
    }
    const destinations = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    };
    const next = destinations[event.key];
    if (!Number.isInteger(next)) return;
    event.preventDefault();
    selectTab(next);
    tabs[next].focus();
  });
});

function selectTab(active) {
  tabs.forEach((tab, index) => {
    const selected = index === active;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[index].hidden = !selected;
  });
}

function selectLinkedTab() {
  const linked = panels.findIndex((panel) => location.hash === "#" + panel.id);
  if (linked >= 0) selectTab(linked);
}

selectTab(0);
selectLinkedTab();
window.addEventListener("hashchange", selectLinkedTab);

const dialog = document.querySelector("#media-dialog");
const title = document.querySelector("#media-title");
const body = document.querySelector("#media-body");
const external = document.querySelector("#media-external");
const alternate = document.querySelector("#media-alternate");
const mediaLinks = document.querySelector("#media-links");
let mediaTrigger;

function loadPlayer(url, playerTitle) {
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = playerTitle;
  frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  frame.allowFullscreen = true;
  body.replaceChildren(frame);
}

alternate.addEventListener("click", () => {
  const id = mediaTrigger?.dataset.vimeo;
  if (!/^\d+$/.test(id || "")) return;
  loadPlayer("https://player.vimeo.com/video/" + id + "?autoplay=1&dnt=1", title.textContent);
});

document.addEventListener("click", (event) => {
  const goal = event.target.closest("[data-goal]");
  if (goal) reachGoal(goal.dataset.goal);

  const link = event.target.closest("[data-video], [data-photo]");
  if (!link || typeof dialog.showModal !== "function" || event.ctrlKey || event.metaKey ||
      event.shiftKey || event.altKey || event.button !== 0) return;

  event.preventDefault();
  mediaTrigger = link;
  const video = link.dataset.video;
  title.textContent = video ? link.dataset.title : link.dataset.photo;
  mediaLinks.hidden = !video;
  alternate.hidden = !link.dataset.vimeo;

  if (video) {
    const [owner, id] = video.split("_");
    const embed = new URL("https://vk.com/video_ext.php");
    embed.search = new URLSearchParams({ oid: owner, id, autoplay: "1" });
    external.href = link.href;
    loadPlayer(embed.href, link.dataset.title);
    reachGoal("video_open");
  } else {
    const photo = new Image();
    photo.src = link.href;
    photo.alt = link.dataset.photo;
    body.replaceChildren(photo);
  }

  dialog.showModal();
});

dialog.addEventListener("close", () => {
  body.replaceChildren();
  mediaTrigger?.focus({ preventScroll: true });
});

dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

const feedbackDialog = document.querySelector("#feedback-dialog");
const feedbackForm = document.querySelector("#feedback-form");
const feedbackStatus = document.querySelector("#feedback-status");
let feedbackTrigger;

document.querySelectorAll("[data-feedback]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (typeof feedbackDialog.showModal !== "function" || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    feedbackTrigger = link;
    feedbackStatus.textContent = "";
    feedbackDialog.showModal();
  });
});

feedbackDialog.addEventListener("close", () => {
  feedbackTrigger?.focus({ preventScroll: true });
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(feedbackForm);
  const name = String(fields.get("name")).trim();
  const contact = String(fields.get("contact")).trim();
  const question = String(fields.get("question")).trim();
  if (!name || !question) {
    feedbackStatus.textContent = "Укажите имя и напишите вопрос.";
    feedbackForm.elements[name ? "question" : "name"].focus();
    return;
  }
  const subject = encodeURIComponent("Вопрос о тренинге СНГ");
  const lines = ["Имя: " + name];
  if (contact) lines.push("Контакт для ответа: " + contact);
  lines.push("", question);
  feedbackStatus.textContent = "Отправьте подготовленное письмо из вашей почты.";
  window.location.href = "mailto:psy-sng.ru@yandex.ru?subject=" + subject +
    "&body=" + encodeURIComponent(lines.join("\r\n"));
});
