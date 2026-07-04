import { Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Evita que la pantalla de carga desaparezca hasta que las fuentes estén listas
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Cargamos las variaciones de la fuente Nunito
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // Ocultamos el Splash Screen una vez que las fuentes terminaron de cargar
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Si las fuentes aún no cargan, devolvemos null para esperar
  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}