// components/EyedropperTool.js
import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import Magnifier from "./Magnifier";

const EyedropperTool = ({ 
  imageUri, 
  imageLayout, 
  imageDimensions,
  onColorPicked,
  onTouchEnd,
  isActive = false 
}) => {
  const magnifierRef = useRef(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  const calculateImageCoords = useCallback((pageX, pageY) => {
    if (!imageLayout.width || !imageDimensions.height) {
      console.log("❌ No image layout data");
      return { x: 0, y: 0 };
    }

    const localX = pageX - imageLayout.x;
    const localY = pageY - imageLayout.y;

    // Проверяем, что касание внутри области изображения
    const isInsideImage = 
      localX >= 0 && localX <= imageLayout.width &&
      localY >= 0 && localY <= imageDimensions.height;

    if (!isInsideImage) {
      console.log("❌ Touch outside image area");
      return null;
    }

    // Получаем реальные координаты пикселя на изображении
    return new Promise((resolve) => {
      if (!imageUri) {
        resolve(null);
        return;
      }

      // Для упрощения используем пропорциональное преобразование
      // В реальном приложении нужно использовать Image.getSize()
      const scaleX = imageLayout.width / imageDimensions.width;
      const scaleY = imageDimensions.height / imageDimensions.height;
      
      const imgX = Math.round((localX / imageLayout.width) * imageDimensions.width);
      const imgY = Math.round((localY / imageDimensions.height) * imageDimensions.height);

      console.log("🎯 Calculated image coords:", imgX, imgY);
      resolve({ x: imgX, y: imgY });
    });
  }, [imageUri, imageLayout, imageDimensions]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isActive,
      onMoveShouldSetPanResponder: () => isActive,
      onPanResponderGrant: async (evt) => {
        if (!isActive) return;
        
        const { pageX, pageY } = evt.nativeEvent;
        console.log("🖐️ Eyedropper started at:", pageX, pageY);
        
        setScreenPos({ x: pageX, y: pageY });
        setShowMagnifier(true);
        
        const coords = await calculateImageCoords(pageX, pageY);
        if (coords) {
          setMagnifierPos(coords);
          if (magnifierRef.current) {
            magnifierRef.current.updateCoords(coords.x, coords.y);
          }
        }
      },
      onPanResponderMove: async (evt) => {
        if (!isActive) return;
        
        const { pageX, pageY } = evt.nativeEvent;
        setScreenPos({ x: pageX, y: pageY });
        
        const coords = await calculateImageCoords(pageX, pageY);
        if (coords) {
          setMagnifierPos(coords);
          if (magnifierRef.current) {
            magnifierRef.current.updateCoords(coords.x, coords.y);
          }
        }
      },
      onPanResponderRelease: (evt) => {
        if (!isActive) return;
        
        console.log("🖐️ Eyedropper released");
        const color = magnifierRef.current?.getPickedColor();
        console.log("🎨 Final color:", color);
        
        if (color && onColorPicked) {
          onColorPicked(color);
        }
        
        setShowMagnifier(false);
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
      onPanResponderTerminate: () => {
        setShowMagnifier(false);
      },
    })
  ).current;

  if (!isActive) {
    return null;
  }

  return (
    <View 
      style={StyleSheet.absoluteFill}
      {...panResponder.panHandlers}
    >
      {/* Лупа */}
      {showMagnifier && (
        <View
          style={[
            styles.magnifierContainer,
            {
              left: screenPos.x - 60,
              top: screenPos.y - 60,
            }
          ]}
          pointerEvents="none"
        >
          <Magnifier
            ref={magnifierRef}
            imageUri={imageUri}
            x={magnifierPos.x}
            y={magnifierPos.y}
            size={120}
            zoom={3}
            onColorPicked={(color) => {
              console.log("🎨 Color picked in magnifier:", color);
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  magnifierContainer: {
    position: "absolute",
    width: 120,
    height: 120,
    zIndex: 1000,
  },
});

export default EyedropperTool;