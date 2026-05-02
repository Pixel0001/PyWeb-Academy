import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, clearToken } from '../../../lib/api';
import { getLevel, getNextLevel } from '../../../lib/levels';

const MODULE_THEMES = [
  { from: '#fbbf24', to: '#f97316' },   // amber
  { from: '#facc15', to: '#f59e0b' },   // yellow
  { from: '#fb7185', to: '#ec4899' },   // rose
  { from: '#38bdf8', to: '#3b82f6' },   // sky
  { from: '#34d399', to: '#14b8a6' },   // emerald
  { from: '#a78bfa', to: '#a855f7' },   // violet
];

export default function Dashboard() {
  const { token } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        api(`/api/public/learn/${token}`),
        api(`/api/public/learn/${token}/leaderboard`).catch(() => null),
      ]);
      setData(d);
      setStats(s);
    } catch (e) {
      Alert.alert('Eroare', e.message);
      if (e.message?.includes('Token invalid')) {
        await clearToken();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = () => {
    Alert.alert('Deconectare', 'Ești sigur?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Da', style: 'destructive', onPress: async () => {
        await clearToken();
        router.replace('/login');
      } },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-900">
        <ActivityIndicator color="#fbbf24" size="large" />
      </View>
    );
  }

  if (!data) return null;

  const { student, modules } = data;
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (s, m) => s + m.lessons.filter(l => l.progress?.completedAt).length, 0
  );
  const globalPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const xp = stats?.me?.xp ?? 0;
  const rank = stats?.me?.rank ?? 0;
  const level = getLevel(xp);
  const nextLevel = getNextLevel(level);
  const xpIntoLevel = xp - level.min;
  const xpNeeded = nextLevel ? nextLevel.min - level.min : 1;
  const levelPct = nextLevel ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100;

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      {/* Header gradient */}
      <View className="bg-brand-900 px-5 pt-4 pb-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View className="bg-accent-400 w-9 h-9 rounded-xl items-center justify-center">
              <Ionicons name="rocket" size={18} color="#1e3a8a" />
            </View>
            <View>
              <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Spațiul tău</Text>
              <Text className="text-white font-extrabold text-base leading-tight">PyWeb Academy</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} hitSlop={10} className="p-2">
            <Ionicons name="log-out-outline" size={22} color="#fbbf24" />
          </Pressable>
        </View>

        <Text className="text-white text-2xl font-extrabold">
          Salut, <Text className="text-accent-400">{student.fullName.split(' ')[0]}</Text>!
        </Text>

        {/* Stats row */}
        <View className="flex-row gap-3 mt-4">
          {/* Progress card */}
          <View className="flex-1 bg-white/10 rounded-2xl p-3">
            <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Progres</Text>
            <Text className="text-white text-2xl font-extrabold mt-0.5">
              {completedLessons}<Text className="text-white/40 text-sm font-normal">/{totalLessons}</Text>
            </Text>
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <View className="h-full bg-accent-400 rounded-full" style={{ width: `${globalPct}%` }} />
            </View>
            <Text className="text-white/50 text-[10px] mt-1">{globalPct}% completate</Text>
          </View>

          {/* XP card */}
          <View className="flex-1 bg-white/10 rounded-2xl p-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={11} color="#fde047" />
              <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Nivel {level.num}</Text>
            </View>
            <Text className="text-white text-2xl font-extrabold mt-0.5">
              {xp}<Text className="text-white/40 text-sm font-normal"> XP</Text>
            </Text>
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <View className="h-full rounded-full" style={{ width: `${levelPct}%`, backgroundColor: level.bar }} />
            </View>
            <Text className="text-white/50 text-[10px] mt-1" numberOfLines={1}>
              {level.name}{nextLevel ? ` · ${nextLevel.min - xp} XP →` : ''}
            </Text>
          </View>
        </View>

        {/* Leaderboard CTA */}
        <Link href={`/(learn)/${token}/leaderboard`} asChild>
          <Pressable className="mt-3 bg-white/10 rounded-2xl p-3 flex-row items-center gap-3 active:bg-white/20">
            <View className="w-9 h-9 bg-accent-400 rounded-xl items-center justify-center">
              <Ionicons name="trophy" size={18} color="#1e3a8a" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-extrabold text-sm">Clasament</Text>
              <Text className="text-white/60 text-xs">
                {rank > 0 ? `Locul #${rank} din ${stats.total}` : 'Vezi topul elevilor'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </Link>
      </View>

      {/* Modules list */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e3a8a" />}
      >
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Modulele tale ({modules.length})
        </Text>

        {modules.map((m, idx) => {
          const theme = MODULE_THEMES[idx % MODULE_THEMES.length];
          const doneL = m.lessons.filter(l => l.progress?.completedAt).length;
          const totalL = m.lessons.length;
          const pct = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;
          const isLocked = !m.unlocked;

          return (
            <View
              key={m.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-gray-100"
              style={{ opacity: isLocked ? 0.55 : 1 }}
            >
              {/* Module header */}
              <View
                className="px-4 py-3 flex-row items-center gap-3"
                style={{ backgroundColor: theme.from }}
              >
                <View className="w-10 h-10 bg-white/30 rounded-xl items-center justify-center">
                  <Text className="text-white font-extrabold text-base">{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-extrabold text-base" numberOfLines={1}>{m.title}</Text>
                  <Text className="text-white/80 text-xs">
                    {totalL} lecții {m.language ? `· ${m.language}` : ''}
                  </Text>
                </View>
                {isLocked
                  ? <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" />
                  : <Text className="text-white font-extrabold text-base">{pct}%</Text>}
              </View>

              {/* Lessons */}
              {!isLocked && (
                <View>
                  {m.lessons.slice(0, 5).map((l, lIdx) => {
                    const done = l.progress?.completedAt;
                    const started = !done && (l.progress?.theoryCompleted || (l.progress?.currentProblemIndex ?? 0) > 0);
                    const accessible = l.accessible;

                    return (
                      <Link
                        key={l.id}
                        href={accessible ? `/(learn)/${token}/lesson/${l.id}` : `/(learn)/${token}`}
                        asChild
                      >
                        <Pressable
                          className="px-4 py-3 flex-row items-center gap-3 active:bg-gray-50 border-t border-gray-50"
                          disabled={!accessible}
                        >
                          <View className={`w-8 h-8 rounded-full items-center justify-center ${
                            done ? 'bg-emerald-100' : started ? 'bg-blue-100' : accessible ? 'bg-gray-100' : 'bg-gray-100'
                          }`}>
                            {done
                              ? <Ionicons name="checkmark" size={16} color="#10b981" />
                              : !accessible
                                ? <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                                : <Text className="text-xs font-bold text-gray-600">{lIdx + 1}</Text>}
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                              {l.title}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {l._count?.problems ?? 0} probleme
                              {l.isFree && !accessible ? ' · Gratis' : ''}
                            </Text>
                          </View>
                          {accessible && <Ionicons name="chevron-forward" size={16} color="#9ca3af" />}
                        </Pressable>
                      </Link>
                    );
                  })}
                  {m.lessons.length > 5 && (
                    <View className="px-4 py-2 bg-gray-50">
                      <Text className="text-xs text-gray-400 text-center">
                        +{m.lessons.length - 5} alte lecții
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {isLocked && (
                <View className="px-4 py-4 bg-gray-50">
                  <Text className="text-xs text-gray-500 text-center">
                    🔒 Termină modulul anterior pentru a-l debloca
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
