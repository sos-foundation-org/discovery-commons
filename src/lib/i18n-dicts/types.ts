export type Dict = Record<string, string>;

/** One feature area's strings in every supported locale. */
export interface DictSet {
  en: Dict;
  "zh-TW": Dict;
  "zh-CN": Dict;
}
