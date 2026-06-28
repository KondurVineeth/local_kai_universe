import { Compass } from '@phosphor-icons/react';

import { Icon, ScrollArea } from '@shared/ds/primitives';

import { DetailHeader } from './DetailHeader';
import { DownloadOptionsCard } from './DownloadOptionsCard';
import { MetaChips } from './MetaChips';
import { MoreFromAuthor } from './MoreFromAuthor';
import { ReadmeSection } from './ReadmeSection';

import type { Model } from '@shared/domain/model/entities/Model';

interface ModelDetailProps {
  readonly model: Model | null;
  readonly allModels: readonly Model[];
}

export function ModelDetail({ model, allModels }: ModelDetailProps) {
  if (!model) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-2 text-fg-subtle">
        <Icon icon={Compass} size="lg" />
        <p className="text-xs">Pick a model from the list to see details.</p>
      </section>
    );
  }
  return (
    <section className="flex h-full min-h-0 flex-col bg-bg-base">
      <ScrollArea className="flex-1">
        <div className="mx-auto flex max-w-[820px] flex-col gap-6 px-6 py-6">
          <DetailHeader model={model} />
          <p className="text-sm leading-relaxed text-fg-default">{model.description}</p>
          <MetaChips model={model} />
          <DownloadOptionsCard model={model} />
          <ReadmeSection markdown={model.readmeMarkdown} />
          <MoreFromAuthor model={model} allModels={allModels} />
        </div>
      </ScrollArea>
    </section>
  );
}
