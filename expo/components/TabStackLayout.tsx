import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { UserCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHome } from '@/contexts/HomeContext';

interface TabStackLayoutProps {
  title: string;
}

export default function TabStackLayout({ title }: TabStackLayoutProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { homeProfile } = useHome();

  const profileButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/profile')}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      testID="header-profile-button"
    >
      {homeProfile.profileImage ? (
        <Image
          source={{ uri: homeProfile.profileImage }}
          style={[layoutStyles.avatar, { borderColor: colors.primary }]}
        />
      ) : (
        <View style={[layoutStyles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
          <UserCircle size={22} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title, headerRight: profileButton }} />
    </Stack>
  );
}

const layoutStyles = StyleSheet.create({
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
