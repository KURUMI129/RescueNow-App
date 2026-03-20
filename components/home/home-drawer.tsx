import { Ionicons } from "@expo/vector-icons";
import {
    Animated,
    Modal,
    PanResponderInstance,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
import {
    HomeDrawerActionId,
    HomeDrawerRouteId,
} from "@/constants/home-drawer-routes";
import { HomeThemeColors } from "@/constants/home-theme";

export type HomeDrawerCopy = {
  drawerTitle: string;
  drawerClose: string;
  drawerProfileName: string;
  drawerProfileEmail: string;
  drawerProfileStatus: string;
  drawerProfileOnline: string;
  drawerHome: string;
  drawerServices: string;
  drawerTracking: string;
  drawerSettings: string;
  drawerLogout: string;
};

type HomeDrawerProps = {
  visible: boolean;
  colors: HomeThemeColors;
  copy: HomeDrawerCopy;
  activeRoute: HomeDrawerRouteId;
  drawerBackdropOpacity: Animated.Value;
  drawerTranslateX: Animated.Value;
  drawerItemAnimValues: Animated.Value[];
  drawerPanHandlers: PanResponderInstance["panHandlers"];
  onClose: () => void;
  onAction: (actionId: HomeDrawerActionId) => void;
};

export function HomeDrawer({
  visible,
  colors,
  copy,
  activeRoute,
  drawerBackdropOpacity,
  drawerTranslateX,
  drawerItemAnimValues,
  drawerPanHandlers,
  onClose,
  onAction,
}: HomeDrawerProps) {
  const actionItems: Array<{
    id: HomeDrawerActionId;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    isActive: boolean;
    isDanger?: boolean;
    animationIndex: number;
  }> = [
    {
      id: "services",
      label: copy.drawerServices,
      icon: "construct-outline",
      isActive: activeRoute === "services",
      animationIndex: 1,
    },
    {
      id: "tracking",
      label: copy.drawerTracking,
      icon: "navigate-outline",
      isActive: activeRoute === "tracking",
      animationIndex: 2,
    },
    {
      id: "options",
      label: copy.drawerSettings,
      icon: "settings-outline",
      isActive: activeRoute === "options",
      animationIndex: 3,
    },
    {
      id: "logout",
      label: copy.drawerLogout,
      icon: "log-out-outline",
      isActive: false,
      isDanger: true,
      animationIndex: 4,
    },
  ];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.drawerOverlay}>
        <Animated.View
          style={[styles.drawerBackdrop, { opacity: drawerBackdropOpacity }]}
        >
          <Pressable style={styles.drawerBackdropTouch} onPress={onClose} />
        </Animated.View>

        <Animated.View
          {...drawerPanHandlers}
          style={[
            styles.drawerPanel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              transform: [{ translateX: drawerTranslateX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
              {copy.drawerTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.drawerClose}
              onPress={onClose}
              style={({ pressed }) => [
                styles.drawerCloseButton,
                {
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View
            style={[
              styles.drawerProfileCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <BrandLogo width={40} height={34} />
            <View style={styles.drawerProfileTextWrap}>
              <Text
                style={[
                  styles.drawerProfileName,
                  { color: colors.textPrimary },
                ]}
              >
                {copy.drawerProfileName}
              </Text>
              <Text
                style={[
                  styles.drawerProfileEmail,
                  { color: colors.textSecondary },
                ]}
              >
                {copy.drawerProfileEmail}
              </Text>
              <Text
                style={[
                  styles.drawerProfileStatus,
                  { color: colors.textSecondary },
                ]}
              >
                {copy.drawerProfileStatus}
              </Text>
            </View>
            <View
              style={[
                styles.drawerOnlineBadge,
                { backgroundColor: colors.success },
              ]}
            >
              <View
                style={[
                  styles.drawerOnlineDot,
                  { backgroundColor: colors.surface },
                ]}
              />
              <Text
                style={[styles.drawerOnlineText, { color: colors.surface }]}
              >
                {copy.drawerProfileOnline}
              </Text>
            </View>
          </View>

          <AnimatedDrawerItem
            animation={drawerItemAnimValues[0]}
            active={activeRoute === "home"}
            colors={colors}
            icon="home-outline"
            label={copy.drawerHome}
            onPress={onClose}
          />

          {actionItems.map((item) => (
            <AnimatedDrawerItem
              key={item.id}
              animation={drawerItemAnimValues[item.animationIndex]}
              active={item.isActive}
              colors={colors}
              icon={item.icon}
              label={item.label}
              onPress={() => onAction(item.id)}
              danger={item.isDanger}
            />
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

type AnimatedDrawerItemProps = {
  animation: Animated.Value;
  active: boolean;
  colors: HomeThemeColors;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function AnimatedDrawerItem({
  animation,
  active,
  colors,
  icon,
  label,
  onPress,
  danger = false,
}: AnimatedDrawerItemProps) {
  const baseColor = danger
    ? colors.danger
    : active
      ? colors.primary
      : colors.textPrimary;

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.drawerItem,
          active ? styles.drawerItemActive : undefined,
          { opacity: pressed ? 0.82 : 1 },
          {
            backgroundColor: active ? colors.mapBackground : "transparent",
            borderColor: active ? colors.cardBorder : "transparent",
          },
        ]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={18} color={baseColor} />
        <Text style={[styles.drawerItemText, { color: baseColor }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: "#333333",
  },
  drawerBackdropTouch: {
    flex: 1,
  },
  drawerPanel: {
    width: 264,
    borderLeftWidth: 1,
    paddingTop: 54,
    paddingHorizontal: 14,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  drawerCloseButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerProfileCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  drawerProfileTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  drawerProfileName: {
    fontSize: 13,
    fontWeight: "800",
  },
  drawerProfileEmail: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  drawerProfileStatus: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  drawerOnlineBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  drawerOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  drawerOnlineText: {
    fontSize: 10,
    fontWeight: "800",
  },
  drawerItem: {
    minHeight: 44,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  drawerItemActive: {
    borderWidth: 1,
    marginBottom: 2,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
