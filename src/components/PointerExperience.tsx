import { useEffect, useRef } from 'react';

const interactiveSelector = 'a, button, [data-interactive], [data-magnetic]';

export default function PointerExperience() {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointer.matches || reducedMotion.matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let pointerX = -100;
    let pointerY = -100;
    let cursorX = pointerX;
    let cursorY = pointerY;
    let frame = 0;
    let activeMagnet: HTMLElement | null = null;

    const render = () => {
      cursorX += (pointerX - cursorX) * 0.22;
      cursorY += (pointerY - cursorY) * 0.22;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      ring.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      frame = requestAnimationFrame(render);
    };

    const resetMagnet = () => {
      if (activeMagnet) {
        activeMagnet.style.transform = '';
        activeMagnet = null;
      }
    };

    const move = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');

      if (!target || !target.isConnected) {
        resetMagnet();
        return;
      }

      if (activeMagnet !== target) {
        resetMagnet();
        activeMagnet = target;
      }

      const bounds = target.getBoundingClientRect();
      const strength = Number(target.dataset.magneticStrength ?? 0.12);
      const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) * strength;
      const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) * strength;
      target.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    };

    const over = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest(interactiveSelector)) {
        ring.classList.add('is-hovering');
      }
    };

    const out = (event: PointerEvent) => {
      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (!nextTarget?.closest(interactiveSelector)) ring.classList.remove('is-hovering');
      if (!nextTarget?.closest('[data-magnetic]')) resetMagnet();
    };

    frame = requestAnimationFrame(render);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerout', out, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      resetMagnet();
    };
  }, []);

  return (
    <>
      <span ref={cursorRef} className="hive-cursor" aria-hidden="true" />
      <span ref={ringRef} className="hive-cursor-ring" aria-hidden="true" />
    </>
  );
}