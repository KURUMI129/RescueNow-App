import React from "react";
import Svg, { Circle, Rect, Path, G, Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";

interface RexAvatarProps {
  size?: number;
}

export function RexAvatar({ size = 48 }: RexAvatarProps) {
  return (
    <Svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
    >
      <Defs>
        <RadialGradient id="goldGradient" cx="30%" cy="20%" r="60%">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="60%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </RadialGradient>
      </Defs>
      <Circle
        cx="32"
        cy="32"
        r="32"
        fill="url(#goldGradient)"
      />
      <G transform="translate(9, 9) scale(0.71875)">
        <Ellipse cx="18" cy="22" rx="8" ry="11" fill="#7C2D12" />
        <Ellipse cx="46" cy="22" rx="8" ry="11" fill="#7C2D12" />
        <Ellipse cx="32" cy="36" rx="18" ry="17" fill="#FED7AA" />
        <Ellipse cx="32" cy="42" rx="12" ry="9" fill="#FFFBEB" />
        <Circle cx="26" cy="34" r="2.4" fill="#0B1120" />
        <Circle cx="38" cy="34" r="2.4" fill="#0B1120" />
        <Circle cx="26.8" cy="33.2" r="0.8" fill="#fff" />
        <Circle cx="38.8" cy="33.2" r="0.8" fill="#fff" />
        <Ellipse cx="32" cy="40" rx="2.6" ry="1.8" fill="#0B1120" />
        <Path
          d="M32 42 Q 28 46 26 44 M32 42 Q 36 46 38 44"
          stroke="#0B1120"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <Rect x="10" y="8" width="44" height="8" rx="4" fill="#DC2626" />
        <Rect x="28" y="4" width="8" height="8" rx="2" fill="#FFFFFF" />
        <Rect x="30" y="6" width="4" height="4" fill="#DC2626" />
      </G>
    </Svg>
  );
}