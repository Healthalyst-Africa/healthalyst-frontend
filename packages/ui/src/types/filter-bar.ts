export type FilterBarOption = {
  value: string;
  label: string;
};

export type FilterBarSelectFilter = {
  /** Unique within the bar; also forms the control's element identifier. */
  key: string;
  label: string;
  options: readonly FilterBarOption[];
  /** Shown when no option is chosen, for example "All statuses". */
  allOptionsLabel: string;
  /** The chosen option's value, or an empty string for all options. */
  value: string;
  onValueChange: (value: string) => void;
};

export type FilterBarSearch = {
  label: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
};

export type FilterBarProperties = {
  /** Names the group of filters for assistive technology. */
  accessibleLabel: string;
  /** Prefixes the identifiers of the bar's controls so several bars can share a page. */
  identifier: string;
  search?: FilterBarSearch;
  filters: readonly FilterBarSelectFilter[];
  disabled?: boolean;
  className?: string;
};
