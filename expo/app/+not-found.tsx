import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Home } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function NotFoundScreen() {
  const { colors: c } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.iconContainer, { backgroundColor: c.surfaceAlt }]}>
          <Home size={40} color={c.textTertiary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>Page not found</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>The page you're looking for doesn't exist.</Text>
        <Link href="/" style={[styles.link, { backgroundColor: c.primary }]}>
          <Text style={[styles.linkText, { color: c.white }]}>Back to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  link: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
