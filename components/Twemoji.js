// src/components/Twemoji.js
import React, { memo } from "react";
import { Image, Text, View} from "react-native";

const getTwemojiCodePoints = (emoji) => {
  const codePoints = [];
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i);
    if (code === 0x200D || code === 0xFE0F) continue;
    if (code >= 0xD800 && code <= 0xDFFF) continue;
    codePoints.push(code.toString(16).toLowerCase());
    if (code > 0xFFFF) i++;
  }
  return codePoints.join('-');
};

const UNSUPPORTED_EMOJIS = new Set(['🫨', '🫷', '🫸', '🩷', '🩵', '🩶', '🫩']);

export const Twemoji = memo(({ emoji, size = 20, style }) => {
  if (!emoji) return null;
  
  if (UNSUPPORTED_EMOJIS.has(emoji)) {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }

  const simpleEmoji = emoji.split('\u200D')[0];
  
  try {
    const codePoints = getTwemojiCodePoints(simpleEmoji);
    if (!codePoints) {
      return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
    }

    const uri = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoints}.png`;

    return (
      <Image 
        source={{ uri }} 
        style={[
          { 
            width: size, 
            height: size,
          },
          style
        ]}
        onError={() => <Text style={[style, { fontSize: size }]}>{emoji}</Text>}
      />
    );
  } catch (error) {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }
});

export const EmojiText = memo(({ text, style, numberOfLines }) => {
  if (!text) return null;

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
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

  if (parts.length === 0) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
      {parts}
    </View>
  );
});