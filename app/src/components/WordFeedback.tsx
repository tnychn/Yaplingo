import { View, Text as RNText } from "react-native"
import { useColorScheme } from "react-native"
import tw from "twrnc"
import { Text } from "~/components"

interface Alignment {
  token: string
  score: number | null
}

interface WordFeedbackProps {
  text?: string
  alignments?: Alignment[]
}

export default function WordFeedback({ text = "", alignments = [] }: WordFeedbackProps) {
  const scheme = useColorScheme()
  const isDark = scheme === "dark"

  // Split text into words
  const words = text.split(/\s+/).filter(w => w.length > 0)

  // DEBUG: Log the incoming data
  console.log("=== WordFeedback Debug ===")
  console.log("Text:", text)
  console.log("Words:", words)
  console.log("Alignments:", alignments)
  console.log("========================")

  // Build a map of normalized token -> scores (handle multiple pronunciations of same word)
  const tokenScoreMap: Record<string, number[]> = {}
  alignments.forEach((a) => {
    const normalized = (a.token ?? "").toLowerCase().trim()
    if (normalized) {
      if (!tokenScoreMap[normalized]) tokenScoreMap[normalized] = []
      if (typeof a.score === "number") tokenScoreMap[normalized].push(a.score)
    }
  })

  const getColorForScore = (score: number | null) => {
    if (score === null || score === undefined) return "#1a1c1bff" // default

    const percentage = score * 100
    if (percentage < 33) return "#EF4444" // red
    if (percentage < 66) return "#F97316" // orange
    return "#10B981" // green
  }

  // Get score for a word by looking it up in the token map
  const getScoreForWord = (word: string, wordIndex: number) => {
    const normalized = word.toLowerCase().trim()
    
    // Try 1: Exact normalized match (case-insensitive, trimmed)
    let scores = tokenScoreMap[normalized]
    if (scores && scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
      console.log(`Word "${word}" -> token match -> score: ${avg}`)
      return avg
    }
    
    // Try 2: Match without punctuation
    const withoutPunctuation = normalized.replace(/[^\w\s]/g, "")
    scores = tokenScoreMap[withoutPunctuation]
    if (scores && scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
      console.log(`Word "${word}" -> punctuation-stripped match -> score: ${avg}`)
      return avg
    }
    
    // Try 3: Check if any token contains this word as substring
    const matchingToken = Object.entries(tokenScoreMap).find(([token]) => 
      token.includes(normalized) || normalized.includes(token)
    )
    if (matchingToken) {
      const [token, tokenScores] = matchingToken
      const avg = tokenScores.reduce((sum, s) => sum + s, 0) / tokenScores.length
      console.log(`Word "${word}" -> substring match with "${token}" -> score: ${avg}`)
      return avg
    }
    
    // Fallback: Use positional index only if no better match found
    if (wordIndex < alignments.length && typeof alignments[wordIndex]?.score === "number") {
      const score = alignments[wordIndex].score
      console.log(`Word "${word}" (idx ${wordIndex}) -> positional fallback -> score: ${score}`)
      return score
    }
    
    console.log(`Word "${word}" -> NO MATCH, returning null`)
    return null
  }

  return (
    <View style={[tw`mt-2 p-4 rounded-lg`, isDark ? tw`bg-zinc-900` : tw`bg-white`]}>
      {/* Legend */}
      <View style={tw`flex-row justify-center items-center mb-4`}>
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

      <View style={tw`px-2`}>
        <RNText style={[tw`text-lg leading-8 text-center`, { flexWrap: "wrap" }]}>
          {words.map((word, idx) => {
            const score = getScoreForWord(word, idx)
            const color = getColorForScore(score)

            return (
              <RNText key={idx} style={[tw`font-semibold`, { color }]}>
                {word}
                {idx < words.length - 1 ? " " : ""}
              </RNText>
            )
          })}
        </RNText>
      </View>
    </View>
  )
}
