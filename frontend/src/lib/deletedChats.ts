const STORAGE_KEY = 'wow_deleted_chats';

function readMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getDeletedChatIds(userId: string): Set<string> {
  const ids = readMap()[userId] || [];
  return new Set(ids);
}

export function addDeletedChat(userId: string, otherUserId: string) {
  const map = readMap();
  const ids = new Set(map[userId] || []);
  ids.add(otherUserId);
  map[userId] = Array.from(ids);
  writeMap(map);
}

export function removeDeletedChat(userId: string, otherUserId: string) {
  const map = readMap();
  const ids = (map[userId] || []).filter((id) => id !== otherUserId);
  if (ids.length) map[userId] = ids;
  else delete map[userId];
  writeMap(map);
}
