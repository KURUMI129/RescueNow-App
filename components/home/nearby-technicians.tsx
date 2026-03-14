import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { HomeThemeColors } from "@/constants/home-theme";

type Technician = {
  id: string;
  name: string;
  specialty: string;
  eta: string;
  distance: string;
};

type NearbyTechniciansProps = {
  colors: HomeThemeColors;
  data: Technician[];
  title?: string;
  etaPrefix?: string;
};

export function NearbyTechnicians({
  colors,
  data,
  title = "Técnicos cercanos",
  etaPrefix = "ETA",
}: NearbyTechniciansProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                borderColor: colors.cardBorder,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.specialtyPill,
                  { backgroundColor: colors.mapBackground },
                ]}
              >
                <Text style={[styles.specialtyText, { color: colors.accent }]}>
                  {item.specialty}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {etaPrefix} {item.eta}
              </Text>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.distance}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  separator: {
    height: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
  },
  specialtyPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    marginRight: 8,
  },
});
