import { Image, ImageResizeMode, StyleSheet, View } from "react-native";

type BrandLogoProps = {
  width: number;
  height: number;
  framed?: boolean;
  frameBackgroundColor?: string;
  frameBorderColor?: string;
  resizeMode?: ImageResizeMode;
};

export function BrandLogo({
  width,
  height,
  framed = false,
  frameBackgroundColor,
  frameBorderColor,
  resizeMode = "contain",
}: BrandLogoProps) {
  const logo = (
    <Image
      source={require("../../assets/images/rescuenow-logo.jpeg")}
      style={[styles.logo, { width, height }]}
      resizeMode={resizeMode}
    />
  );

  if (!framed) {
    return logo;
  }

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: frameBackgroundColor,
          borderColor: frameBorderColor,
          width: width + 32,
          height: height + 24,
        },
      ]}
    >
      {logo}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: "transparent",
  },
  frame: {
    borderWidth: 0,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
