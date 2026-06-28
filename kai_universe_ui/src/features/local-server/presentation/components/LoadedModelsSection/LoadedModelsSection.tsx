import { Brain, Eye, Wrench } from '@phosphor-icons/react';
import { useEffect } from "react";
import { modelPickerOpenRequested } from '@features/shell';

import { Button } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import {selectSelectedModelId,} from "../../store/selectors";
import { ModelId } from '@shared/domain/model/value-objects/ModelId';
import {selectedModelSet,} from "../../store/slice";
import { loadedModelSelected } from '@features/shell';
import { useLoadedModels } from '../../hooks';

export function LoadedModelsSection() {

    const dispatch = useAppDispatch();

    const selectedModelId =
        useAppSelector(selectSelectedModelId);

    const models = useLoadedModels();

    useEffect(() => {

    if (models.length === 0) {
        return;
    }

    const selectedStillExists =
        models.some(
            m => m.model_id === selectedModelId,
        );

    if (selectedStillExists) {
        return;
    }

    const firstModel = models[0];

    if (!firstModel) {
        return;
    }

    const modelId = ModelId.of(firstModel.model_id);

    dispatch(
        selectedModelSet(modelId),
    );

    dispatch(
        loadedModelSelected({
            modelId,
            isReasoning: firstModel.reasoning,
        }),
    );

}, [models, selectedModelId, dispatch]);

    return (

        <section className="border-b border-border-default">

            <div className="flex items-center justify-between px-4 py-3">

                <h2 className="text-xs font-semibold text-fg-default">

                    Loaded Models

                </h2>

            </div>

            <div className="px-4 pb-4">

                {

                    models.length === 0 ?

                        <EmptyState
                            onLoad={() =>
                                dispatch(modelPickerOpenRequested())
                            }
                        />

                        :

                        models.map(model => (

                            <ReadyCard
                                key={model.model_id}
                                model={model}
                                selected={selectedModelId === model.model_id}
                                onClick={() => {
                                    const modelId = ModelId.of(model.model_id);

                                    dispatch(
                                        selectedModelSet(modelId),
                                    );

                                    dispatch(
                                        loadedModelSelected({
                                            modelId,
                                            isReasoning: model.reasoning,
                                        }),
                                    );
                                }}
                            />

                        ))

                }

            </div>

        </section>

    );

}

function EmptyState({ onLoad }: { readonly onLoad: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-bg-raised/30 py-8">
      <p className="text-sm text-fg-muted">Use ZL Universe from other apps or from your code.</p>
      <p className="text-xs text-fg-subtle">Press ⌘L to load a model</p>
      <Button variant="secondary" size="sm" onClick={onLoad}>
        Load a Model
      </Button>
    </div>
  );
}


function ReadyCard({
    model,
    selected,
    onClick,
}: {
    readonly model: {
        model_id: string;
        author: string;
        display_name: string;
        hf_repository: string;
        status: string;
        size_gb: number;
        vision: boolean;
        reasoning: boolean;
        tools: boolean;
    };

    readonly selected: boolean;

    readonly onClick: () => void;
}) {

    return (

        <div onClick={onClick}
    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        selected
            ? "border-accent bg-bg-raised"
            : "border-border-default bg-bg-raised/30 hover:bg-bg-raised/50"
    }`}>

            <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-medium text-success">

                {model.status}

            </span>

            <div className="flex flex-1 flex-col">

                <span className="font-mono text-xs text-accent">

                    {model.author}/{model.model_id}

                </span>

                <span className="text-xs text-fg-muted">

                    {model.display_name}

                </span>

            </div>

            <div className="flex gap-2">

                {model.tools && <Wrench size={16} />}

                {model.reasoning && <Brain size={16} />}

                {model.vision && <Eye size={16} />}

            </div>

            <span className="text-xs">

                {model.size_gb.toFixed(2)} GB

            </span>

        </div>

    );

}

