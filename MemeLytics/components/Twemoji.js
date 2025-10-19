// src/components/Twemoji.js
import React, { memo } from "react";
import { Image, Text, View } from "react-native";
import emojiRegex from "emoji-regex";

const getTwemojiCodePoints = (emoji) => {
  try {
    const codePoints = [];
    for (let i = 0; i < emoji.length; i++) {
      const code = emoji.codePointAt(i);
      if (code === 0xFE0F) continue; // пропускаем variation selector
      if (code >= 0xD800 && code <= 0xDFFF) continue;
      codePoints.push(code.toString(16).toLowerCase());
      if (code > 0xFFFF) i++;
    }
    return codePoints.length > 0 ? codePoints.join("-") : null;
  } catch {
    return null;
  }
};

// только реально неподдерживаемые
const UNSUPPORTED_EMOJIS = new Set([
  "🫨", "🫷", "🫸", "🩷", "🩵", "🩶", "🫩",
]);

export const Twemoji = memo(({ emoji, size = 20, style }) => {
  const [error, setError] = React.useState(false);

  if (!emoji || error) {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }

  try {
    const codePoints = getTwemojiCodePoints(emoji);
    if (!codePoints || UNSUPPORTED_EMOJIS.has(emoji)) {
      return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
    }

    const uri = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/15.1.0/72x72/${codePoints}.png`;

    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size }, style]}
        onError={() => setError(true)}
      />
    );
  } catch {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }
});


export const EmojiText = memo(({ text, style, numberOfLines }) => {
  if (!text) return null;

  const regex = emojiRegex();
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const emoji = match[0];
    const index = match.index;

    if (index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style} numberOfLines={numberOfLines}>
          {text.slice(lastIndex, index)}
        </Text>
      );
    }

    parts.push(
      <Twemoji
        key={`emoji-${index}`}
        emoji={emoji}
        size={style?.fontSize || 16}
        style={{ marginHorizontal: 1 }}
      />
    );

    lastIndex = index + emoji.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={style} numberOfLines={numberOfLines}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
      {parts}
    </View>
  );
});
