import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Image } from "react-native";
import { pickPixelColor } from "./ColorPicker";

const Magnifier = forwardRef(({ imageUri, x, y, size = 120, zoom = 3, imageWidth, imageHeight, ctx }, ref) => {
  const halfSize = size / 2;

  const magnifierStyle = {
    position: "absolute",
    left: x - halfSize,
    top: y - halfSize,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    zIndex: 1000,
  };

  const imageStyle = {
    width: imageWidth * zoom,
    height: imageHeight * zoom,
    position: "absolute",
    left: halfSize - x * zoom,
    top: halfSize - y * zoom,
  };

  useImperativeHandle(ref, () => ({
    async pickColor() {
      if (!ctx || !imageUri) return "#FFFFFF";
      try {
        const color = await pickPixelColor(imageUri, x, y, imageWidth, imageHeight, ctx);
        return color || "#FFFFFF";
      } catch (error) {
        console.log("❌ Error in pickColor:", error);
        return "#FFFFFF";
      }
    }
  }));

  return (
    <View style={magnifierStyle}>
      <Image source={{ uri: imageUri }} style={imageStyle} resizeMode="stretch" />
      <View style={styles.centerCircle} />
    </View>
  );
});

const styles = StyleSheet.create({
  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "white",
    transform: [{ translateX: -3 }, { translateY: -3 }],
    zIndex: 1001,
  },
});

export default Magnifier;
