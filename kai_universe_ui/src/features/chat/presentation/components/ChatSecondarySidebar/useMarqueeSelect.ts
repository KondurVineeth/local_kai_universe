import { useCallback, useEffect, useRef, useState } from 'react';

import type { ThreadId } from '../../../domain/value-objects/ThreadId';

// Drag-select marquee hook for the chat list. Pointerdown on empty sidebar
// space starts a marquee; drag draws a rectangle; release adds every row
// (looked up via `data-thread-id` attributes inside the container ref)
// whose bounding box intersects the marquee to the multi-select set.
//
// Pointerdown only starts the marquee when the target is the container
// itself or a non-interactive descendant (we walk up looking for the row's
// `<li data-thread-id>` — finding one means the user clicked a row, so we
// stay out of the way and let normal click handling take over).
//
// Esc during drag cancels.
export interface MarqueeRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface UseMarqueeSelectOptions {
  readonly onSelect: (threadIds: readonly ThreadId[]) => void;
}

const MIN_DRAG_PX = 4;

export function useMarqueeSelect({ onSelect }: UseMarqueeSelectOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const reset = useCallback(() => {
    startRef.current = null;
    draggingRef.current = false;
    setRect(null);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only the primary mouse button starts a marquee. Right-click / middle-
    // click pass through to the browser.
    if (e.button !== 0) return;
    // If the click landed on a row (or any interactive element inside one),
    // bail — let the row's own click handler run.
    const target = e.target as HTMLElement;
    if (target.closest('[data-thread-id]')) return;
    if (target.closest('button, a, input, textarea, [role="button"]')) return;
    const container = containerRef.current;
    if (!container) return;
    const rectEl = container.getBoundingClientRect();
    startRef.current = { x: e.clientX - rectEl.left, y: e.clientY - rectEl.top };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    const container = containerRef.current;
    if (!start || !container) return;
    const rectEl = container.getBoundingClientRect();
    const x = e.clientX - rectEl.left;
    const y = e.clientY - rectEl.top;
    const dx = Math.abs(x - start.x);
    const dy = Math.abs(y - start.y);
    if (!draggingRef.current && dx < MIN_DRAG_PX && dy < MIN_DRAG_PX) return;
    draggingRef.current = true;
    setRect({
      left: Math.min(start.x, x),
      top: Math.min(start.y, y),
      width: dx,
      height: dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    const container = containerRef.current;
    if (!container || !draggingRef.current || !rect) {
      reset();
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const absLeft = containerRect.left + rect.left;
    const absTop = containerRect.top + rect.top;
    const absRight = absLeft + rect.width;
    const absBottom = absTop + rect.height;
    const matched: ThreadId[] = [];
    container.querySelectorAll<HTMLElement>('[data-thread-id]').forEach((row) => {
      const r = row.getBoundingClientRect();
      const intersects =
        r.right >= absLeft && r.left <= absRight && r.bottom >= absTop && r.top <= absBottom;
      if (intersects) {
        const id = row.dataset.threadId as ThreadId | undefined;
        if (id) matched.push(id);
      }
    });
    reset();
    if (matched.length > 0) onSelect(matched);
  }, [rect, reset, onSelect]);

  useGlobalCancel({ draggingRef, startRef, reset, onPointerUp });

  return {
    containerRef,
    rect,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

// Esc cancels mid-drag; a global pointerup catches releases that land
// outside the marquee container (the user dragged off the sidebar).
function useGlobalCancel({
  draggingRef,
  startRef,
  reset,
  onPointerUp,
}: {
  readonly draggingRef: React.MutableRefObject<boolean>;
  readonly startRef: React.MutableRefObject<{ x: number; y: number } | null>;
  readonly reset: () => void;
  readonly onPointerUp: () => void;
}): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && draggingRef.current) {
        e.preventDefault();
        reset();
      }
    };
    const onUp = () => {
      if (draggingRef.current) onPointerUp();
      else if (startRef.current) reset();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingRef, startRef, reset, onPointerUp]);
}
