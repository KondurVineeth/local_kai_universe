import { X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectLearnModalOpen } from '../../store/selectors';
import { learnModalClosed } from '../../store/slice';

import { Slide1 } from './Slide1';
import { Slide2 } from './Slide2';
import { Slide3 } from './Slide3';
import { Slide4 } from './Slide4';
import { DotIndicator } from './SlideShared';

const SLIDE_COUNT = 4;

function useModalChrome(open: boolean): React.MutableRefObject<HTMLDivElement | null> {
  const dispatch = useAppDispatch();
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Capture the element that opened the modal so we can restore focus on
  // close (WAI-ARIA dialog pattern).
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, [open]);
  // Body-scroll lock while open so wheel/arrow events behind the backdrop
  // don't shift content under the modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(learnModalClosed());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, dispatch]);
  return dialogRef;
}

export function LearnHowItWorksModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectLearnModalOpen);
  const [slide, setSlide] = useState(0);
  const dialogRef = useModalChrome(open);

  useEffect(() => {
    if (open) setSlide(0);
  }, [open]);

  if (!open) return null;

  const close = () => dispatch(learnModalClosed());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={close}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="learn-modal-title"
        className="relative w-[900px] max-w-[95vw] overflow-hidden rounded-xl bg-bg-surface shadow-2xl outline-none"
        style={{ height: 580 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span id="learn-modal-title" className="sr-only">
          How Remote works
        </span>
        <button
          className="absolute right-4 top-4 z-10 rounded-full bg-bg-raised p-1.5 text-fg-subtle hover:text-fg-default"
          onClick={close}
          aria-label="Close"
        >
          <X weight="bold" size={16} />
        </button>

        <div className="h-[512px]">
          {slide === 0 && <Slide1 />}
          {slide === 1 && <Slide2 />}
          {slide === 2 && <Slide3 />}
          {slide === 3 && <Slide4 />}
        </div>

        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              disabled={slide === 0}
            >
              Back
            </Button>
            <DotIndicator total={SLIDE_COUNT} active={slide} onSelect={setSlide} />
          </div>
          {slide < SLIDE_COUNT - 1 ? (
            <Button variant="secondary" size="md" onClick={() => setSlide((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={close}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
