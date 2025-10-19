import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, PanResponder, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DrawingTools = React.memo(({
  brushSize,
  brushType,
  brushColor,
  isDrawing,
  eyedropperActive,
  onBrushSizeChange,
  onBrushTypeChange,
  onColorSelect,
  onEyedropperActivate,
  onUndo,
  onClear,
  onColorPickerToggle,
  onSaveDrawing, // Добавляем новую пропсу для сохранения
  showColorPicker,
  containerHeight = 400
}) => {
  const isSliding = useRef(false);
  const [sliderTrackLayout, setSliderTrackLayout] = useState({ y: 0, height: 0 });

  const handleSliderMove = (pageY) => {
    if (!sliderTrackLayout.height || !sliderTrackLayout.y) return;
    const relativeY = pageY - sliderTrackLayout.y;
    const clampedY = Math.max(0, Math.min(sliderTrackLayout.height, relativeY));
    const percentage = 1 - clampedY / sliderTrackLayout.height;
    const newSize = Math.max(1, Math.min(30, Math.round(1 + percentage * 29)));
    onBrushSizeChange(newSize);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          isSliding.current = true;
          handleSliderMove(evt.nativeEvent.pageY);
        },
        onPanResponderMove: (evt) => {
          if (isSliding.current) handleSliderMove(evt.nativeEvent.pageY);
        },
        onPanResponderRelease: () => {
          isSliding.current = false;
        },
        onPanResponderTerminate: () => {
          isSliding.current = false;
        },
      }),
    [sliderTrackLayout, onBrushSizeChange]
  );

  const getBrushIcon = () => {
    switch (brushType) {
      case 'pen':
        return 'edit';
      case 'marker':
        return 'brush';
      case 'arrow':
        return 'arrow-forward';
      default:
        return 'edit';
    }
  };

  const colorPalette = useMemo(
    () => [
      '#ffffff', '#000000', '#FF0000', '#00FF00', '#0000FF',
      '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
      '#FFC0CB', '#008000', '#800000', '#000080', '#808080',
      '#A52A2A', '#FFD700', '#DA70D6', '#FF6347', '#40E0D0',
      '#EE82EE', '#F5DEB3', '#9ACD32', '#FF4500', '#6A5ACD',
    ],
    []
  );

  const getSliderTopPosition = () => {
    if (!containerHeight) return 0;
    return Math.max(10, (containerHeight - 125) / 2);
  };
  const sliderTop = getSliderTopPosition();

  const handleColorSelect = (color) => {
    if (onColorSelect) onColorSelect(color);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topToolbar}>
        <TouchableOpacity onPress={onUndo} style={styles.toolButton}>
          <Icon name="undo" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onBrushTypeChange} style={styles.toolButton}>
          <Icon name={getBrushIcon()} size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClear} style={styles.toolButton}>
          <Icon name="delete" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onColorPickerToggle} style={styles.toolButton}>
          <Icon name="color-lens" size={28} color="#fff" />
        </TouchableOpacity>
        {/* Заменяем onDrawingModeToggle на onSaveDrawing */}
        <TouchableOpacity onPress={onSaveDrawing} style={styles.toolButton}>
          <Icon name="check" size={28} color="#9cfceeff" />
        </TouchableOpacity>
      </View>

      {isDrawing && !eyedropperActive && (
        <View style={[styles.brushSliderContainer, { top: sliderTop }]}>
          <View
            style={styles.brushSliderTrack}
            onLayout={(e) => {
              const { height } = e.nativeEvent.layout;
              e.target.measure((x, layoutY, width, layoutHeight, pageX, pageY) => {
                setSliderTrackLayout({ y: pageY, height: layoutHeight });
              });
            }}
            {...panResponder.panHandlers}
          >
            <View
              style={[
                styles.brushSliderProgress,
                {
                  height: `${((brushSize - 1) / 29) * 100}%`,
                  backgroundColor: isSliding.current ? '#0FAF95' : '#16DBBE',
                },
              ]}
            />
            <View
              style={[
                styles.brushSliderThumb,
                {
                  bottom: `${((brushSize - 1) / 29) * 100}%`,
                  width: isSliding.current ? brushSize : 16,
                  height: isSliding.current ? brushSize : 16,
                  borderRadius: (isSliding.current ? brushSize : 16) / 2,
                  backgroundColor: isSliding.current ? '#0FAF95' : '#16DBBE',
                  left: '50%',
                  transform: [
                    { translateX: -(isSliding.current ? brushSize : 16) / 2 },
                  ],
                },
              ]}
            />
          </View>
        </View>
      )}

      {showColorPicker && isDrawing && !eyedropperActive && (
        <View style={styles.bottomPalette}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteContent}
          >
            <TouchableOpacity
              onPress={onEyedropperActivate}
              onLongPress={onEyedropperActivate}
              delayLongPress={300}
              style={styles.colorItem}
            >
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: eyedropperActive ? '#16DBBE' : '#fff',
                    borderWidth: 2,
                  },
                ]}
              >
                <Icon name="colorize" size={20} color="#000" />
              </View>
            </TouchableOpacity>

            {colorPalette.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => handleColorSelect(color)}
                style={styles.colorItem}
              >
                <View
                  style={[
                    styles.colorBox,
                    {
                      backgroundColor: color,
                      borderColor:
                        brushColor === color ? '#16DBBE' : 'transparent',
                      borderWidth: brushColor === color ? 3 : 1,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topToolbar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 12,
    zIndex: 20,
  },
  toolButton: {
    padding: 4,
  },
  brushSliderContainer: {
    position: 'absolute',
    left: 15,
    zIndex: 10,
    alignItems: 'center',
  },
  brushSliderTrack: {
    width: 6,
    height: 125,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    position: 'relative',
  },
  brushSliderThumb: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
  },
  brushSliderProgress: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#16DBBE',
    borderRadius: 3,
  },
  bottomPalette: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 12,
    zIndex: 10,
    maxHeight: 60,
  },
  paletteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  colorItem: {
    marginHorizontal: 3,
  },
  colorBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default DrawingTools;