import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts as useCormorant, CormorantGaramond_500Medium, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts as useManrope, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [cormorantLoaded] = useCormorant({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });
  const [manropeLoaded] = useManrope({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const ready = (iconsLoaded || iconsError) && cormorantLoaded && manropeLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9F6F0' },
        headerBackVisible: false,
        headerBackTitleVisible: false,
      }}
    />
  );
}
