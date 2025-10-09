// StaticFilteredImage.js
import React from 'react';
import { Image, View } from 'react-native';
import {
  Grayscale,
  Sepia,
  Invert,
  Contrast,
  Brightness,
  Saturate,
  HueRotate,
} from "react-native-color-matrix-image-filters";

const StaticFilteredImage = ({ filter, uri, style }) => {
  if (!uri) return <View style={[style, { backgroundColor: "#ccc" }]} />;
  
  const imageElement = <Image source={{ uri }} style={style} />;
  
  if (filter === "none") {
    return imageElement;
  }

  switch (filter) {
    case "grayscale":
      return <Grayscale>{imageElement}</Grayscale>;
    case "sepia":
      return <Sepia>{imageElement}</Sepia>;
    case "invert":
      return <Invert>{imageElement}</Invert>;
    case "contrast":
      return <Contrast amount={2.0}>{imageElement}</Contrast>;
    case "brightness":
      return <Brightness amount={1.4}>{imageElement}</Brightness>;
    case "saturate":
      return <Saturate amount={2.0}>{imageElement}</Saturate>;
    case "hue":
      return <HueRotate amount={Math.PI / 2}>{imageElement}</HueRotate>;
    default:
      return imageElement;
  }
};

export default StaticFilteredImage;