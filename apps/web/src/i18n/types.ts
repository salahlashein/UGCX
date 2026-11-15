import en from './en.json';

export type Locale = 'en' | 'ar';

export type TranslationDictionary = typeof en;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

export type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>>;
      }[keyof T]
    : '';

export type TranslationKey = Leaves<TranslationDictionary>;

export type TranslateFn = (
  key: TranslationKey | (string & {}),
  defaultValueOrParams?: string | Record<string, string | number | undefined>,
  maybeParams?: Record<string, string | number | undefined>,
) => string;
