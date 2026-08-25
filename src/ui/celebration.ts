export interface CelebrationHandle {
  dragon(fromRect: DOMRect): void;
  panda(fromRect: DOMRect): void;
  clear(): void;
}

function parseDuration(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value.endsWith("ms")) {
    return Number.parseFloat(value);
  }
  if (value.endsWith("s")) {
    return Number.parseFloat(value) * 1000;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function centerRelativeToHost(fromRect: DOMRect, hostRect: DOMRect) {
  return {
    x: fromRect.left - hostRect.left + fromRect.width / 2,
    y: fromRect.top - hostRect.top + fromRect.height / 2,
  };
}

export function mountCelebration(host: HTMLElement): CelebrationHandle {
  let clearTimer: number | undefined;

  const scheduleClear = (duration: number) => {
    if (clearTimer !== undefined) {
      window.clearTimeout(clearTimer);
    }
    clearTimer = window.setTimeout(() => {
      host.replaceChildren();
      host.className = "";
    }, duration);
  };

  const emitParticles = (count: number, kind: "dragon" | "panda", fromRect: DOMRect) => {
    host.replaceChildren();
    host.className = `celebration-layer is-${kind}`;

    const hostRect = host.getBoundingClientRect();
    const origin = centerRelativeToHost(fromRect, hostRect);
    const duration = parseDuration(kind === "dragon" ? "--dur-dragon" : "--dur-panda");

    if (kind === "dragon") {
      const wash = document.createElement("div");
      wash.className = "celebration-wash";
      host.append(wash);
    }

    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      particle.className = `celebration-particle is-${kind}`;
      particle.style.left = `${origin.x}px`;
      particle.style.top = `${origin.y}px`;
      particle.style.setProperty("--dx", `${randomRange(-140, 140)}px`);
      particle.style.setProperty("--dy", `${kind === "dragon" ? randomRange(-180, -60) : randomRange(-150, -40)}px`);
      particle.style.setProperty("--rot", `${randomRange(-120, 220)}deg`);
      particle.style.setProperty("--size", `${randomRange(kind === "dragon" ? 6 : 10, kind === "dragon" ? 12 : 18)}px`);
      particle.style.setProperty("--delay", `${Math.round(index * (kind === "dragon" ? 26 : 22))}ms`);
      host.append(particle);
    }

    scheduleClear(duration);
  };

  return {
    dragon(fromRect) {
      emitParticles(18, "dragon", fromRect);
    },
    panda(fromRect) {
      emitParticles(14, "panda", fromRect);
    },
    clear() {
      if (clearTimer !== undefined) {
        window.clearTimeout(clearTimer);
      }
      host.replaceChildren();
      host.className = "";
    },
  };
}
