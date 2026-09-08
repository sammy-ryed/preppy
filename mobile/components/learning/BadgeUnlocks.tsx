import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useBadges } from '../../hooks/useBadges';
import { getUnseenBadges, type BadgeId } from '../../domain/badges';

type Badge = ReturnType<typeof useBadges>['badges'][number];
const NotificationContext = createContext<{
  pending: Badge[]; acknowledge: (id: BadgeId) => Promise<void>;
} | null>(null);

export function useBadgeNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('Badge notifications need BadgeUnlocks.');
  return value;
}

export function BadgeUnlocks({ children }: { children: ReactNode }) {
  const { badges, storageKey, status } = useBadges();
  const pathname = usePathname();
  const navigation = useRootNavigationState();
  const router = useRouter();
  const [seen, setSeen] = useState<{ key: string; ids: string[] } | null>(null);
  const opening = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    async function restore() {
      let ids: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(storageKey!);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string');
      } catch { /* A missing notification cache must not hide earned badges. */ }
      if (!cancelled) setSeen({ key: storageKey!, ids });
    }
    void restore();
    return () => { cancelled = true; };
  }, [storageKey]);
  const pending = seen?.key === storageKey ? getUnseenBadges(badges, seen.ids) : [];
  const nextId = pending[0]?.notificationId;
  useEffect(() => {
    if (pathname === '/badge-unlock') { opening.current = false; return; }
    if (!navigation?.key || status !== 'ready' || !nextId || opening.current) return;
    // Only present on stable learning screens, never over startup or a landscape game.
    if (!(pathname === '/map' || pathname === '/badges' || pathname === '/achievements' || pathname.startsWith('/quest/'))) return;
    opening.current = true;
    router.push('/badge-unlock');
  }, [navigation?.key, nextId, pathname, router, status]);

  async function acknowledge(id: BadgeId) {
    if (!seen || seen.key !== storageKey) return;
    const notificationId = badges.find(badge => badge.id === id)?.notificationId;
    if (!notificationId) return;
    const next = { key: seen.key, ids: [...new Set([...seen.ids, notificationId])] };
    // Update the queue immediately; slow device storage must not trap the close button.
    setSeen(next);
    try { await AsyncStorage.setItem(next.key, JSON.stringify(next.ids)); }
    catch { /* Dismissal still works in this session if storage fails. */ }
  }
  return <NotificationContext.Provider value={{ pending, acknowledge }}>{children}</NotificationContext.Provider>;
}
