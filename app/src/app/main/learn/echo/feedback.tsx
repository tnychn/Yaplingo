"use client";

import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import tw from "twrnc";
import { useEchoResultQuery } from "~/client";
import { Text } from "~/components";

const getWordColor = (score: number): string => {
  const p = score * 100;
  if (p >= 67) return tw.color("green-500")!;
  if (p >= 34) return tw.color("orange-500")!;
  return tw.color("red-500")!;
};

const WordColoredFeedback = ({
  text,
  alignments,
}: {
  text: string;
  alignments: { token: string; score: number }[];
}) => {
  const words = text.split(/\s+/);

  const wordScores = useMemo(() => {
    const scores: number[] = [];
    let idx = 0;

    const perWord = Math.max(1, Math.floor(alignments.length / words.length));

    for (let i = 0; i < words.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = 0; j < perWord && idx < alignments.length; j++) {
        sum += alignments[idx].score;
        count++;
        idx++;
      }

      scores.push(count > 0 ? sum / count : 0.3);
    }

    return scores;
  }, [words, alignments]);

  return (
    <View style={tw`flex-row flex-wrap justify-center gap-1`}>
      {words.map((w, i) => (
        <Text
          key={i}
          style={[
            tw`text-xl font-semibold`,
            { color: getWordColor(wordScores[i] ?? 0.3) },
          ]}
        >
          {w}
        </Text>
      ))}
    </View>
  );
};

export default function MainLearnEchoFeedbackScreen() {
  const player = useAudioPlayer();
  const { tid, text } = useLocalSearchParams<{ tid: string; text: string }>();

  // Fetch only the scoring result
  const { data: result, ...query } = useEchoResultQuery(tid);

  // Auto play audio once per result
  useEffect(() => {
    if (!result?.feedback?.audio) return;

    player.replace(result.feedback.audio);
    player.seekTo(0);
    player.play();
  }, [result, player]);

  // Score % display
  const percentage = useMemo(() => {
    if (!result) return undefined;

    const scores = result.pronunciation.alignments.map((a) => a.score);
    return Math.round(
      (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
    );
  }, [result]);

  const color = useMemo(() => {
    if (!percentage) return tw.color("gray-500");
    if (percentage >= 75) return tw.color("green-500");
    if (percentage >= 50) return tw.color("yellow-500");
    return tw.color("red-500");
  }, [percentage]);

  const message = useMemo(() => {
    if (!percentage) return undefined;
    if (percentage >= 75) return "Great job!";
    if (percentage >= 50) return "Good effort!";
    return "Keep practicing!";
  }, [percentage]);

  if (!query.isSuccess || !result) return null;

  return (
    <View style={tw`flex-1 gap-8 p-4`}>
      {/* Score */}
      <View style={tw`mt-4 gap-2`}>
        <Text style={[tw`text-center text-5xl font-bold tracking-tighter`, { color }]}>
          {percentage}
        </Text>

        <Text style={[tw`text-center text-2xl font-medium`, { color }]}>
          {message}
        </Text>
        
      </View>

      {/* Word Colored Feedback */}
      <View style={tw`rounded-2xl border-2 border-zinc-500/50 p-4 gap-2`}>
                <View style={tw`flex-row justify-center items-center`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-4 h-4 rounded-full bg-red-500`} />
                <Text style={tw`text-xs text-gray-600 dark:text-gray-400`}>Wrong</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-4 h-4 rounded-full bg-orange-500`} />
                <Text style={tw`text-xs text-gray-600 dark:text-gray-400`}>Fair</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-4 h-4 rounded-full bg-green-500`} />
                <Text style={tw`text-xs text-gray-600 dark:text-gray-400`}>Great</Text>
              </View>
            </View>
          </View>
        <WordColoredFeedback
          text={text} // ← use router param text (NO BACKEND FETCH)
          alignments={result.pronunciation.alignments}
        />
      </View>

      {/* AI Feedback */}
      <View style={tw`gap-2 rounded-2xl border-2 border-zinc-500/50 p-4`}>
        <Text style={tw`text-lg`}>{result.feedback.text}</Text>
      </View>
    </View>
  );
}
