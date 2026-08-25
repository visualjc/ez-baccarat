/** Read storage without letting privacy-mode SecurityErrors prevent mounting. */
export function readStoredItem(key: string, getStorage: () => Pick<Storage, "getItem"> = () => window.localStorage): string | null {
  try {
    return getStorage().getItem(key);
  } catch {
    return null;
  }
}
