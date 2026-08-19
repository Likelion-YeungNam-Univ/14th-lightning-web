const UNSAVEABLE_TABS = new Set(["bok", "fed"]);

/** Public central-bank content is intentionally excluded from favorites. */
export function canSaveCardFromTab(tab: string | undefined) {
  return !tab || !UNSAVEABLE_TABS.has(tab);
}
