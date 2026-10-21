export const SEARCH_OPEN = "cn-search-open";
export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_OPEN));
}
