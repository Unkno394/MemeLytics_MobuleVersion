import React from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

const DraggableText = React.memo(({
  id,
  text,
  fontSize,
  color,
  fontFamily,
  background = false,
  backgroundColor = "transparent",
  startX = 0,
  startY = 0,
  onOpenEditor,
  containerWidth,
  containerHeight,
  isDrawingMode = false, // теперь ожидаем этот пропс
  isSelected = false,
  onSelect,
  onUpdate,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const savedX = useSharedValue(startX);
  const savedY = useSharedValue(startY);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const TOP_PANEL_HEIGHT = 120;
  const BOTTOM_PANEL_HEIGHT = 100;
  const SIDE_PANEL_WIDTH = 50;

  const clampToContainer = (x, y) => {
    'worklet';
    const minX = -SIDE_PANEL_WIDTH;
    const maxX = containerWidth + SIDE_PANEL_WIDTH;
    
    const minY = -TOP_PANEL_HEIGHT;
    const maxY = containerHeight + BOTTOM_PANEL_HEIGHT;
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  const openEditor = () => {
    if (onOpenEditor) {
      onOpenEditor({
        id,
        text,
        fontSize,
        color,
        fontFamily,
        x: translateX.value,
        y: translateY.value,
        scale: scale.value,
        rotation: rotation.value,
        background,
        backgroundColor,
      });
    } else if (onSelect) {
      onSelect();
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!isDrawingMode)
    .onBegin(() => {
      'worklet';
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = savedX.value + e.translationX;
      const newY = savedY.value + e.translationY;
      const clamped = clampToContainer(newX, newY);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      'worklet';
      if (onUpdate) {
        runOnJS(onUpdate)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!isDrawingMode)
    .hitSlop(250)
    .onBegin(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newScale = Math.max(0.5, Math.min(4, savedScale.value * e.scale));
      scale.value = newScale;
      const clamped = clampToContainer(translateX.value, translateY.value);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      'worklet';
      if (onUpdate) {
        runOnJS(onUpdate)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  const rotationGesture = Gesture.Rotation()
    .enabled(!isDrawingMode)
    .hitSlop(250)
    .onBegin(() => {
      'worklet';
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      'worklet';
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      'worklet';
      if (onUpdate) {
        runOnJS(onUpdate)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(!isDrawingMode)
    .maxDuration(250)
    .onEnd(() => {
      'worklet';
      runOnJS(openEditor)();
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
    position: "absolute",
    left: 0,
    top: 0,
    opacity: isDrawingMode ? 0.8 : 1,
    zIndex: isSelected ? 10 : 5,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      {/* pointerEvents управляем как пропсом, а не в animated style */}
      <Animated.View
        style={animatedStyle}
        pointerEvents={isDrawingMode ? "none" : "auto"}
      >
        <View
          style={{
            backgroundColor: background ? backgroundColor : "transparent",
            padding: background ? 8 : 0,
            borderRadius: background ? 4 : 0,
            alignSelf: "flex-start",
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? "#16DBBE" : "transparent",
          }}
        >
          <Text
            style={{
              fontSize,
              color,
              fontFamily,
              textAlign: "center",
              textShadowColor: "#000",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 3,
              includeFontPadding: false,
            }}
          >
            {text}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

export default DraggableText;

