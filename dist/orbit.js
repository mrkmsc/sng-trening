"use strict";

(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let strands;

  function makeStrands() {
    // Match the geometry and orientation of the static orbit-weave.svg.
    const samples = 120;
    const turn = 2 * Math.PI;
    return Array.from({ length: 30 }, (_, strand) => {
      const phase = turn * strand / 30;
      return Array.from({ length: samples }, (_, sample) => {
        const angle = turn * sample / samples;
        const radius = 203 + 89 * Math.cos(3 * angle + phase);
        const x = radius * Math.cos(2 * angle) + 17 * Math.cos(phase);
        const y = (radius * Math.sin(2 * angle) + 17 * Math.sin(phase)) * 0.85;
        return [x, y, x.toFixed(1) + "," + y.toFixed(1)];
      });
    });
  }

  function enableOrbit(orbit) {
    const area = orbit.closest(".hero") || orbit.closest(".approach-art");
    const weave = orbit.querySelector(".weave");
    const guide = orbit.querySelector(".orbit-guide");
    let group;
    let paths;
    let target;
    let pointer;
    let strength = 0;
    let frame = 0;
    let lastTime = 0;

    function initialize() {
      strands ??= makeStrands();
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("viewBox", "0 0 760 760");
      svg.setAttribute("fill", "none");
      svg.classList.add("orbit-live");
      group = document.createElementNS(svgNamespace, "g");
      group.setAttribute("transform", "translate(380 380) rotate(-24)");
      group.setAttribute("stroke", "#bfa572");
      group.setAttribute("stroke-width", ".75");
      paths = strands.map((_, index) => {
        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("opacity", (0.21 + index % 5 * 0.065).toFixed(2));
        group.append(path);
        return path;
      });
      svg.append(group);
      weave.append(svg);
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      target = undefined;
      pointer = undefined;
      strength = 0;
      guide.style.transform = "";
      orbit.classList.remove("orbit-active");
    }

    function draw(time) {
      frame = 0;
      const elapsed = lastTime ? Math.min(time - lastTime, 48) : 16;
      lastTime = time;
      const blend = 1 - Math.exp(-elapsed / 125);
      strength += ((target ? 1 : 0) - strength) * blend;

      if (!target && strength < 0.008) {
        reset();
        return;
      }

      if (target) {
        pointer.x += (target.x - pointer.x) * blend;
        pointer.y += (target.y - pointer.y) * blend;
      }

      const matrix = group.getScreenCTM();
      if (!matrix) {
        reset();
        return;
      }

      const local = new DOMPoint(pointer.x, pointer.y).matrixTransform(matrix.inverse());
      const radius = 150;
      strands.forEach((points, index) => {
        const coordinates = points.map(([x, y, original]) => {
          const dx = local.x - x;
          const dy = local.y - y;
          const influence = 1 - (dx * dx + dy * dy) / (radius * radius);
          if (influence <= 0) return original;
          const pull = 0.82 * strength * influence * influence;
          return (x + dx * pull).toFixed(1) + "," + (y + dy * pull).toFixed(1);
        });
        paths[index].setAttribute("d", "M" + coordinates.join(" ") + "Z");
      });

      const bounds = orbit.getBoundingClientRect();
      const offsetX = (pointer.x - (bounds.left + bounds.width / 2)) / bounds.width;
      const offsetY = (pointer.y - (bounds.top + bounds.height / 2)) / bounds.height;
      guide.style.transform = "translate(" + (18 * offsetX * strength) + "px," +
        (18 * offsetY * strength) + "px)";
      orbit.classList.add("orbit-active");

      if (!target || strength < 0.995 || Math.hypot(target.x - pointer.x, target.y - pointer.y) > 0.15) {
        frame = requestAnimationFrame(draw);
      } else {
        lastTime = 0;
      }
    }

    function release() {
      if (!target) return;
      target = undefined;
      if (!frame) frame = requestAnimationFrame(draw);
    }

    area.addEventListener("pointermove", (event) => {
      if (motion.matches || event.pointerType === "touch") return;
      const bounds = orbit.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      const distance = Math.hypot(x - bounds.left - bounds.width / 2, y - bounds.top - bounds.height / 2);
      if (distance > bounds.width * 0.48) {
        release();
        return;
      }

      if (!group) initialize();
      target = { x, y };
      pointer ??= { x, y };
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });

    area.addEventListener("pointerleave", release);
    area.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    window.addEventListener("scroll", release, { passive: true });
    motion.addEventListener("change", reset);
  }

  document.querySelectorAll("[data-orbit]").forEach(enableOrbit);
})();
