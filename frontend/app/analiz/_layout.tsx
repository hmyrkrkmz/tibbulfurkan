import { Stack } from 'expo-router';
export default function AnalysisLayout() {
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
