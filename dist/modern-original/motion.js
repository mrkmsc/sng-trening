"use strict";

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-once");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1 });

  document.querySelectorAll(".section h2, .person, .program-stage").forEach((element) => {
    observer.observe(element);
  });
}

const approachMap = document.querySelector(".application-map");
const approachAnnouncement = document.querySelector("#approach-announcement");

approachMap.addEventListener("change", (event) => {
  const descriptionId = event.target.getAttribute("aria-controls");
  const description = document.getElementById(descriptionId);
  if (description) approachAnnouncement.textContent = description.querySelector("p").textContent;
});
