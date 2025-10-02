import React from "react";
import { Text, StyleSheet } from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
} from "react-native-reanimated";

const Sticker = ({ emoji, initialX = 60, initialY = 60 }) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const panHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = ctx.startScale * event.scale;
      if (scale.value < 0.3) scale.value = 0.3;
      if (scale.value > 4) scale.value = 4;
    },
  });

  const rotateHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startRot = rotation.value;
    },
    onActive: (event, ctx) => {
      rotation.value = ctx.startRot + event.rotation;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
    position: "absolute",
  }));

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View style={animatedStyle}>
        <RotationGestureHandler onGestureEvent={rotateHandler}>
          <Animated.View>
            <PinchGestureHandler onGestureEvent={pinchHandler}>
              <Animated.View>
                <Text style={styles.emoji}>{emoji}</Text>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </RotationGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  emoji: {
    fontSize: 48,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Sticker;

