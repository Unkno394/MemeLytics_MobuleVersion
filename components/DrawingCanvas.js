import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedProps,
  runOnJS 
} from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const DrawingCanvas = React.memo(
({
  brushColor,
  brushSize,
  brushType,
  isDrawingMode,
  eyedropperActive,
  onPathAdd,
  drawingPaths,
  containerWidth,
  containerHeight,
  onDrawingActiveChange,
}) => {
  const isDrawing = useSharedValue(false);
  const currentPathD = useSharedValue("");
  const currentPathColor = useSharedValue(brushColor);
  const startPoint = useSharedValue(null);

  useEffect(() => {
    if (brushColor && brushColor.startsWith("#") && (brushColor.length === 7 || brushColor.length === 9)) {
      currentPathColor.value = brushColor;
    } else {
      currentPathColor.value = "#FFFFFF";
    }
  }, [brushColor]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isDrawingMode && !eyedropperActive)
        .onBegin((e) => {
          if (!isDrawingMode || eyedropperActive) return;
          isDrawing.value = true;
          runOnJS(onDrawingActiveChange)?.(true);

          currentPathD.value = `M ${e.x},${e.y}`;
          startPoint.value = { x: e.x, y: e.y };
        })
        .onUpdate((e) => {
          if (!isDrawingMode || !isDrawing.value || eyedropperActive) return;

          if (brushType === "arrow") {
            currentPathD.value = `M ${startPoint.value.x},${startPoint.value.y} L ${e.x},${e.y}`;
          } else {
            currentPathD.value = `${currentPathD.value} L ${e.x},${e.y}`;
          }
        })
        .onEnd((e) => {
          if (!isDrawingMode || !isDrawing.value || eyedropperActive) return;

          runOnJS(onPathAdd)(
            currentPathD.value,
            currentPathColor.value,
            brushType,
            startPoint.value,
            { x: e.x, y: e.y }
          );

          runOnJS(onDrawingActiveChange)?.(false);
          currentPathD.value = "";
          isDrawing.value = false;
        })
        .onFinalize(() => {
          runOnJS(onDrawingActiveChange)?.(false);
          isDrawing.value = false;
        }),
    [isDrawingMode, eyedropperActive, brushType, brushColor, onPathAdd, onDrawingActiveChange]
  );

  const animatedPathProps = useAnimatedProps(() => ({
    d: currentPathD.value,
    stroke: currentPathColor.value,
  }));

  const renderDrawingPaths = () => {
    return drawingPaths.map((p, i) => {
      const isValidColor = p.color && p.color.startsWith('#') && 
                          (p.color.length === 7 || p.color.length === 9);
      const strokeColor = isValidColor ? p.color : "#FFFFFF";
      const strokeWidth = p.strokeWidth && p.strokeWidth > 0 ? p.strokeWidth : 5;
  
      if (p.type !== "arrow" || !p.start || !p.end) {
        return (
          <Path
            key={i}
            d={p.d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={p.type === "marker" ? 0.6 : 1}
            strokeDasharray={p.type === "marker" ? "5,3" : null}
          />
        );
      }

      const angle = Math.atan2(p.end.y - p.start.y, p.end.x - p.start.x);
      const arrowLength = 15;
      const arrowAngle = Math.PI / 6;

      const x1 = p.end.x - arrowLength * Math.cos(angle - arrowAngle);
      const y1 = p.end.y - arrowLength * Math.sin(angle - arrowAngle);

      const x2 = p.end.x - arrowLength * Math.cos(angle + arrowAngle);
      const y2 = p.end.y - arrowLength * Math.sin(angle + arrowAngle);

      return (
        <React.Fragment key={i}>
          <Path
            d={p.d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`M ${p.end.x},${p.end.y} L ${x1},${y1} M ${p.end.x},${p.end.y} L ${x2},${y2}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </React.Fragment>
      );
    });
  };

  return (
    // Контейнер *под* текстом: pointerEvents="box-none" чтобы не мешать событиям в родителе
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 1 } // ниже текста
      ]}
      pointerEvents="box-none"
    >
      {/* GestureDetector должен ловить события — вложенный View делает pointerEvents="auto" */}
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {renderDrawingPaths()}
            {isDrawingMode && (
              <AnimatedPath
                animatedProps={animatedPathProps}
                strokeWidth={brushSize}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={brushType === "marker" ? 0.6 : 1}
                strokeDasharray={
                  brushType === "marker" ? "5,3" :
                  brushType === "arrow" ? "10,5" : null
                }
                stroke={brushColor}
              />
            )}
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
});

export default DrawingCanvas;
