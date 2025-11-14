import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

interface WordFeedbackProps {
  text: string;
  alignments: { token: string; score: number }[];
}

export default function WordFeedback({ text, alignments }: WordFeedbackProps) {
  if (!text || !alignments || alignments.length === 0)
    return (
      <View style={tw`mt-2`}>
        <Text style={tw`text-gray-500 text-center italic`}>
          No detailed feedback yet.
        </Text>
      </View>
    );

  const words = text.split(" ");

  const wordScores = words.map((w, i) => {
    const tokenMatches = alignments.filter((a) =>
      w.toLowerCase().includes(a.token.toLowerCase())
    );
    if (tokenMatches.length === 0) return { word: w, score: null };
    const avg =
      tokenMatches.reduce((s, t) => s + (t.score || 0), 0) /
      tokenMatches.length;
    return { word: w, score: avg };
  });

  const getColor = (score: number | null) => {
    if (score === null) return "#22c55e";
    if (score > 0.85) return "#22c55e";
    if (score > 0.6) return "#f59e0b"; 
    return "#ef4444";
  };

  return (
    <View style={tw`flex-row flex-wrap justify-center mt-2`}>
      {wordScores.map((w, i) => (
        <Text
          key={i}
          style={[
            tw`mx-1 my-1 text-lg font-semibold`,
            { color: getColor(w.score) },
          ]}
        >
          {w.word}
        </Text>
      ))}
    </View>
  );
}
