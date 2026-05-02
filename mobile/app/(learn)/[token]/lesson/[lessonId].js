import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { api } from '../../../../lib/api';

const TABS = [
  { key: 'theory', label: 'Teorie', icon: 'book-outline' },
  { key: 'problems', label: 'Probleme', icon: 'extension-puzzle-outline' },
];

export default function Lesson() {
  const { token, lessonId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('theory');
  const [problemIdx, setProblemIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/public/learn/${token}/lesson/${lessonId}`);
      setData(d);
      const startIdx = d.progress?.currentProblemIndex ?? 0;
      setProblemIdx(Math.min(startIdx, (d.lesson.problems.length || 1) - 1));
      if (d.progress?.theoryCompleted) setTab('problems');
    } catch (e) {
      Alert.alert('Eroare', e.message);
      router.back();
    } finally { setLoading(false); }
  }, [token, lessonId]);

  useEffect(() => { load(); }, [load]);

  // Reset answer when changing problem
  useEffect(() => {
    if (!data) return;
    const p = data.lesson.problems[problemIdx];
    if (!p) return;
    if (p.submission) {
      setAnswer(p.submission.answer || '');
      setCode(p.submission.code || '');
      setSelectedOption(p.submission.answer || null);
    } else {
      setAnswer('');
      setCode(p.starterCode || '');
      setSelectedOption(null);
    }
  }, [problemIdx, data]);

  const markTheoryDone = async () => {
    try {
      await api(`/api/public/learn/${token}/lesson/${lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify({ theoryCompleted: true }),
      });
      setTab('problems');
    } catch (e) { Alert.alert('Eroare', e.message); }
  };

  const submitProblem = async () => {
    const p = data.lesson.problems[problemIdx];
    const payload = { problemId: p.id, lessonId, source: 'lesson' };
    if (p.type === 'CODING') payload.code = code;
    else if (p.type === 'MULTIPLE_CHOICE') payload.answer = selectedOption;
    else payload.answer = answer;

    if (p.type === 'MULTIPLE_CHOICE' && !selectedOption) {
      Alert.alert('Atenție', 'Alege un răspuns');
      return;
    }
    if (p.type !== 'MULTIPLE_CHOICE' && !payload.answer && !payload.code) {
      Alert.alert('Atenție', 'Scrie un răspuns');
      return;
    }

    setSubmitting(true);
    try {
      await api(`/api/public/learn/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Reload lesson to get updated submission
      const d = await api(`/api/public/learn/${token}/lesson/${lessonId}`);
      setData(d);

      if (p.type === 'CODING') {
        Alert.alert('Trimis!', 'Problema a fost trimisă spre verificare profesorului.');
      } else {
        const updated = d.lesson.problems[problemIdx];
        if (updated.submission?.autoCorrect) {
          Alert.alert('Corect! 🎉', 'Felicitări, răspuns corect!');
        } else {
          Alert.alert('Greșit', 'Mai încearcă!');
        }
      }
    } catch (e) {
      Alert.alert('Eroare', e.message);
    } finally { setSubmitting(false); }
  };

  const goNext = async () => {
    const next = problemIdx + 1;
    if (next < data.lesson.problems.length) {
      setProblemIdx(next);
      try {
        await api(`/api/public/learn/${token}/lesson/${lessonId}`, {
          method: 'PATCH',
          body: JSON.stringify({ currentProblemIndex: next }),
        });
      } catch {}
    } else {
      // Finish lesson
      try {
        await api(`/api/public/learn/${token}/lesson/${lessonId}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        });
        Alert.alert('Felicitări! 🎉', 'Ai terminat lecția!', [
          { text: 'Înapoi la dashboard', onPress: () => router.back() },
        ]);
      } catch (e) { Alert.alert('Eroare', e.message); }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-900">
        <ActivityIndicator color="#fbbf24" size="large" />
      </View>
    );
  }
  if (!data) return null;

  const { lesson } = data;
  const totalProblems = lesson.problems.length;
  const currentProblem = lesson.problems[problemIdx];

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      {/* Header */}
      <View className="bg-brand-900 px-4 pt-2 pb-3">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-2">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{lesson.module.title}</Text>
            <Text className="text-white font-extrabold text-base" numberOfLines={1}>{lesson.title}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mt-3 bg-white/10 rounded-xl p-1">
          {TABS.map(t => {
            const active = tab === t.key;
            const disabled = t.key === 'problems' && totalProblems === 0;
            return (
              <Pressable
                key={t.key}
                onPress={() => !disabled && setTab(t.key)}
                disabled={disabled}
                className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
                  active ? 'bg-accent-400' : ''
                }`}
                style={{ opacity: disabled ? 0.4 : 1 }}
              >
                <Ionicons name={t.icon} size={14} color={active ? '#1e3a8a' : '#fff'} />
                <Text className={`text-xs font-bold ${active ? 'text-brand-900' : 'text-white'}`}>
                  {t.label}{t.key === 'problems' && totalProblems > 0 ? ` (${totalProblems})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {tab === 'theory' ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              {lesson.theory ? (
                <Markdown style={markdownStyles}>{lesson.theory}</Markdown>
              ) : (
                <Text className="text-gray-500 text-center py-6">Această lecție nu are teorie scrisă.</Text>
              )}
            </View>

            {totalProblems > 0 && (
              <Pressable
                onPress={markTheoryDone}
                className="bg-accent-400 rounded-2xl py-4 mt-4 flex-row items-center justify-center gap-2 active:opacity-80"
              >
                <Text className="text-brand-900 font-extrabold text-base">Continuă cu probleme</Text>
                <Ionicons name="arrow-forward" size={18} color="#1e3a8a" />
              </Pressable>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress dots */}
            <View className="flex-row justify-center gap-1.5 mb-3">
              {lesson.problems.map((p, i) => {
                const sub = p.submission;
                const isCurrent = i === problemIdx;
                let bg = '#e5e7eb';
                if (sub?.status === 'GRADED' && (sub.grade ?? 0) >= 60) bg = '#10b981';
                else if (sub?.status === 'GRADED' && (sub.grade ?? 0) < 60) bg = '#ef4444';
                else if (sub?.status === 'PENDING') bg = '#f59e0b';
                if (isCurrent) bg = '#1e3a8a';
                return <View key={p.id} style={{ width: isCurrent ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: bg }} />;
              })}
            </View>

            {currentProblem ? (
              <ProblemCard
                problem={currentProblem}
                index={problemIdx}
                total={totalProblems}
                answer={answer}
                setAnswer={setAnswer}
                code={code}
                setCode={setCode}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                onSubmit={submitProblem}
                onNext={goNext}
                submitting={submitting}
              />
            ) : (
              <Text className="text-center text-gray-500 py-8">Nicio problemă în această lecție.</Text>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProblemCard({
  problem, index, total, answer, setAnswer, code, setCode,
  selectedOption, setSelectedOption, onSubmit, onNext, submitting,
}) {
  const sub = problem.submission;
  const isGraded = sub?.status === 'GRADED';
  const isPending = sub?.status === 'PENDING';
  const isCorrect = isGraded && (sub.grade ?? 0) >= 60;

  return (
    <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Problem header */}
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Problema {index + 1} / {total}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text className="text-xs font-bold text-amber-600">{problem.points} pct</Text>
        </View>
      </View>

      {/* Problem body */}
      <View className="p-4">
        <Text className="text-base font-extrabold text-gray-900 mb-2">{problem.title}</Text>
        <Text className="text-sm text-gray-700 leading-relaxed">{problem.description}</Text>

        {problem.hint && (
          <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row gap-2">
            <Ionicons name="bulb-outline" size={16} color="#d97706" />
            <Text className="flex-1 text-xs text-amber-900">{problem.hint}</Text>
          </View>
        )}

        {/* Answer input — depends on type */}
        <View className="mt-4">
          {problem.type === 'MULTIPLE_CHOICE' && (problem.options || []).map((opt, i) => {
            const selected = selectedOption === opt;
            return (
              <Pressable
                key={i}
                onPress={() => !isGraded && !isPending && setSelectedOption(opt)}
                className={`mb-2 p-3 rounded-xl border-2 flex-row items-center gap-2 ${
                  selected ? 'bg-blue-50 border-brand-700' : 'border-gray-200'
                }`}
                disabled={isGraded || isPending}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  selected ? 'border-brand-700' : 'border-gray-300'
                }`}>
                  {selected && <View className="w-2.5 h-2.5 rounded-full bg-brand-700" />}
                </View>
                <Text className="flex-1 text-sm text-gray-900">{opt}</Text>
              </Pressable>
            );
          })}

          {(problem.type === 'SHORT_ANSWER' || problem.type === 'TRUE_FALSE' || problem.type === 'FILL_IN') && (
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Scrie răspunsul aici..."
              placeholderTextColor="#9ca3af"
              editable={!isGraded && !isPending}
              className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 bg-gray-50"
              autoCapitalize="none"
            />
          )}

          {problem.type === 'CODING' && (
            <View>
              <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Codul tău {problem.language ? `(${problem.language})` : ''}
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="// scrie codul aici..."
                placeholderTextColor="#9ca3af"
                editable={!isGraded && !isPending}
                multiline
                numberOfLines={10}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 bg-gray-900"
                style={{
                  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
                  color: '#f1f5f9',
                  minHeight: 200,
                  textAlignVertical: 'top',
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        </View>

        {/* Feedback */}
        {isGraded && (
          <View className={`mt-4 p-3 rounded-xl ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={isCorrect ? '#10b981' : '#ef4444'}
              />
              <Text className={`font-extrabold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isCorrect ? `Corect! +${sub.grade}%` : `Nota: ${sub.grade ?? 0}%`}
              </Text>
            </View>
            {sub.feedback && (
              <Text className="text-sm text-gray-700 mt-1">{sub.feedback}</Text>
            )}
          </View>
        )}

        {isPending && (
          <View className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex-row items-center gap-2">
            <Ionicons name="time-outline" size={18} color="#d97706" />
            <Text className="flex-1 text-sm text-amber-900">
              Trimis spre verificare. Profesorul îți va da răspuns în curând.
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="mt-5 flex-row gap-2">
          {!isGraded && !isPending && (
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              className="flex-1 bg-brand-700 rounded-xl py-3.5 items-center active:opacity-80"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-extrabold">Trimite răspuns</Text>}
            </Pressable>
          )}

          {(isGraded || isPending) && (
            <Pressable
              onPress={onNext}
              className="flex-1 bg-accent-400 rounded-xl py-3.5 flex-row items-center justify-center gap-1.5 active:opacity-80"
            >
              <Text className="text-brand-900 font-extrabold">
                {index + 1 < total ? 'Următoarea' : 'Termină lecția'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#1e3a8a" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const markdownStyles = {
  body: { fontSize: 15, color: '#1f2937', lineHeight: 22 },
  heading1: { fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginTop: 12, marginBottom: 8 },
  heading2: { fontSize: 19, fontWeight: '800', color: '#1e3a8a', marginTop: 10, marginBottom: 6 },
  heading3: { fontSize: 17, fontWeight: '700', color: '#1e40af', marginTop: 8, marginBottom: 4 },
  paragraph: { marginBottom: 10 },
  link: { color: '#2563eb' },
  code_inline: {
    backgroundColor: '#f3f4f6', color: '#be185d', paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 4, fontSize: 13,
  },
  code_block: {
    backgroundColor: '#0f172a', color: '#f1f5f9', padding: 12, borderRadius: 8,
    fontSize: 13, marginVertical: 8,
  },
  fence: {
    backgroundColor: '#0f172a', color: '#f1f5f9', padding: 12, borderRadius: 8,
    fontSize: 13, marginVertical: 8,
  },
  list_item: { marginBottom: 4 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  blockquote: {
    backgroundColor: '#fef3c7', borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    paddingLeft: 12, paddingVertical: 4, marginVertical: 8,
  },
};
