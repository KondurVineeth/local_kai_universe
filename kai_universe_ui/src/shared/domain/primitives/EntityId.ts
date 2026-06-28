// Branded ID type. Each aggregate gets its own subtype via declaration merging.
//
//   const id: ModelId = 'qwen-2.5-7b' as ModelId;
//
// The brand is a phantom field — it exists only at the type level so a
// ChatThreadId can never be passed where a ModelId is expected.
declare const __entityIdBrand: unique symbol;

export type EntityId<TBrand extends string> = string & {
  readonly [__entityIdBrand]: TBrand;
};

export const EntityId = {
  of<TBrand extends string>(value: string): EntityId<TBrand> {
    return value as EntityId<TBrand>;
  },
} as const;
