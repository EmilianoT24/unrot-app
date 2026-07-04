import * as Notifications from 'expo-notifications'; // <-- Importamos las notificaciones
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Configuración para que la alerta suene y se muestre incluso si tienes la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export default function TimerScreen() {
  const router = useRouter();
  const { minutes, appName } = useLocalSearchParams();

  const startingSeconds = Number(minutes) * 60;
  const [secondsLeft, setSecondsLeft] = useState(startingSeconds);
  const [isActive, setIsActive] = useState(false);

  const expectedEndTime = useRef<number | null>(null);
  
  // Guardamos el ID de la notificación para poder cancelarla si el usuario pausa el reloj
  const notificationIdRef = useRef<string | null>(null);

  // 1. SOLICITAR PERMISOS: Se ejecuta una sola vez al abrir la pantalla
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
    requestPermissions();

    // Limpieza al destruir la pantalla: si se sale, borramos cualquier alarma pendiente
    return () => {
      if (notificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      }
    };
  }, []);

  // 2. LÓGICA DEL RELOJ Y PROGRAMACIÓN DE ALARMAS
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    // Función interna para programar la alerta en el sistema operativo
    async function scheduleAlarm(seconds: number) {
      // Si ya había una alarma programada, la borramos para no duplicar
      if (notificationIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      }

      // Programamos la nueva alarma para que suene exactamente en "X" segundos
      notificationIdRef.current = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 ¡Tiempo Unrot Terminado!",
          body: `Tu sesión de ${appName || 'recompensa'} ha finalizado. ¡Regresa a la app!`,
          sound: true, // Usa el sonido por defecto del iPhone
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: seconds
        },
      });
    }

    if (isActive && secondsLeft > 0) {
      // A) Calculamos el tiempo real del fin
      expectedEndTime.current = Date.now() + secondsLeft * 1000;
      
      // B) Mandamos la alarma al sistema operativo para que suene en el fondo
      scheduleAlarm(secondsLeft);

      // C) Mantenemos el reloj visual corriendo por si el usuario se queda viendo la pantalla
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.round((expectedEndTime.current! - now) / 1000);

        if (remaining <= 0) {
          setSecondsLeft(0);
          setIsActive(false);
          clearInterval(interval);
          Alert.alert("¡Tiempo Terminado!", "Tu sesión ha concluido. A volver a la realidad.", [
            { text: "Entendido", onPress: () => router.back() }
          ]);
        } else {
          setSecondsLeft(remaining);
        }
      }, 1000);
      
    } else {
      // D) SI SE PAUSA: Cancelamos la alarma del fondo inmediatamente para que no suene por error
      if (notificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
        notificationIdRef.current = null;
      }
      expectedEndTime.current = null;
    }

    return () => clearInterval(interval);
  }, [isActive]);

  // Matemáticas para el texto 00:00
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Modo Unrot</Text>
      <Text style={styles.subtitle}>Disfrutando: {appName || 'Recompensa'}</Text>

      <View style={styles.timerCircle}>
        <Text style={styles.timeText}>{timeDisplay}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.playButton, isActive && styles.pauseButton]}
          onPress={() => setIsActive(!isActive)}
          disabled={secondsLeft === 0}
        >
          <Text style={styles.playButtonText}>
            {isActive ? "⏸ Pausar Alarma" : "▶️ Iniciar Tiempo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => {
            Alert.alert(
              "¿Abandonar Sesión?",
              "Si te sales ahora, perderás el tiempo restante. La alarma se cancelará.",
              [
                { text: "Quedarme", style: "cancel" },
                { text: "Sí, salir", onPress: () => router.back(), style: "destructive" }
              ]
            );
          }} 
        >
          <Text style={styles.exitButtonText}>Abandonar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#81C784',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 50,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    backgroundColor: '#2A2A2A',
    shadowColor: '#81C784',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '200',
    color: 'white',
    fontVariant: ['tabular-nums'], 
  },
  controls: {
    width: '100%',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#81C784',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  pauseButton: {
    backgroundColor: '#FFA726',
  },
  playButtonText: {
    color: '#1E1E1E',
    fontSize: 20,
    fontWeight: 'bold',
  },
  exitButton: {
    paddingVertical: 15,
  },
  exitButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});