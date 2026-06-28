import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useState } from 'react';

import { NewFeatureBadge } from './SlideShared';

const FAQ_ITEMS = [
  {
    question: 'What is Remote Link and how does it work?',
    answer:
      'Remote Link is a feature in Universe. It allows you to connect together devices on which you have Universe installed. It is end-to-end encrypted, and built on top of custom Tailscale mesh VPNs.\n\nOnce devices are together in a Link, you can load models on remote devices and use them as if they were local. Chats remain local and nothing gets uploaded to Universe\'s backend servers apart from your device list - in order to facilitate device discovery and connection.',
  },
  {
    question: 'Does Remote Link open up my computer to the public Internet?',
    answer:
      'No. Remote Link uses a custom Tailscale mesh VPN for device networking. Your devices communicate directly with each other using end-to-end encryption and are never exposed to the public Internet.',
  },
  {
    question: 'Can I use remote models with Universe\'s local server and other tools?',
    answer:
      'Yes. Remote models accessible through Remote Link appear in the model picker just like local models, and can be used through the local server API endpoint.',
  },
] as const;

export function Slide4() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="flex h-full flex-col gap-xl p-10">
      <NewFeatureBadge />
      <div className="flex flex-col gap-m">
        <h2 className="text-xl font-bold text-fg-default">Remote Link Q&amp;A</h2>
      </div>
      <div className="flex flex-col divide-y divide-border-subtle overflow-y-auto">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem
            key={i}
            question={item.question}
            answer={item.answer}
            open={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}

interface FaqItemProps {
  readonly question: string;
  readonly answer: string;
  readonly open: boolean;
  readonly onToggle: () => void;
}

function FaqItem({ question, answer, open, onToggle }: FaqItemProps) {
  return (
    <div className="py-4">
      <button
        className="flex w-full items-center justify-between gap-m text-left"
        onClick={onToggle}
      >
        <span className="text-sm font-medium text-fg-default">{question}</span>
        {open ? (
          <CaretUp size={14} className="shrink-0 text-fg-subtle" />
        ) : (
          <CaretDown size={14} className="shrink-0 text-fg-subtle" />
        )}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-s">
          {answer.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-fg-subtle leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
