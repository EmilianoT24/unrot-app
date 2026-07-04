import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUnrotStore } from '../store/useUnrotStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Opciones de tiempo predefinidas para simplificar la UI
const TIME_OPTIONS = [5, 10, 15, 20];

export default function ShopScreen() {
  const braincells = useUnrotStore((state) => state.braincells);
  const apps = useUnrotStore((state) => state.apps);
  const buyAppTime = useUnrotStore((state) => state.buyAppTime);
  const router = useRouter();

  // Estados para controlar el Bottom Sheet (Modal)
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<number>(5);

  const openPurchaseModal = (app: any) => {
    if (app.boughtToday >= app.dailyLimit) {
      Alert.alert("Límite alcanzado", `Ya compraste el máximo de ${app.name} por hoy.`);
      return;
    }
    setSelectedApp(app);
    // Seleccionamos por defecto el tiempo mínimo de la app
    setSelectedTime(TIME_OPTIONS[0]);
  };

  const confirmPurchase = () => {
    if (!selectedApp) return;

    // Calculamos el costo por minuto para cobrar lo justo
    const costPerMin = selectedApp.cost / selectedApp.timeGranted;
    const totalCost = costPerMin * selectedTime;

    if (braincells < totalCost) {
      Alert.alert("Saldo insuficiente", "Sigue completando actividades para ganar más Braincells.");
      return;
    }

    // Cerramos el modal
    setSelectedApp(null);

    // OJO: Asegúrate de que tu store acepte estos nuevos parámetros (ID, Tiempo, Costo)
    buyAppTime(selectedApp.id, selectedTime, totalCost); 
    
    // Navegamos al timer
    router.push({ 
      pathname: '/timer', 
      params: { minutes: selectedTime, appName: selectedApp.name } 
    });
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <ImageBackground source={require('../../assets/images/shop-background.jpg')} style={styles.heroBackground} resizeMode="cover">
          
          <View style={styles.floatingCoinBadge}>
            <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIcon} />
            <Text style={styles.floatingCoinText}>{braincells}</Text>
          </View>

          <Image source={require('../../assets/images/brain-store.png')} style={styles.avatar} />
        </ImageBackground>
      </View>

      <BlurView intensity={80} tint="light" style={styles.overlapCard}>
        <View>
          <Text style={styles.title}>Tienda Unrot</Text>
          <Text style={styles.subtitle}>Compra tiempo sin culpa.</Text>
        </View>
      </BlurView>

      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {apps.map((item) => {
          const isMaxedOut = item.boughtToday >= item.dailyLimit;
          const isTooExpensive = braincells < item.cost;
          // Si quieres que no se pueda clickear cuando no hay saldo o se llegó al límite:
          const isDisabled = isMaxedOut || isTooExpensive;

          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.appGridItem, isDisabled && styles.appGridItemDisabled]}
              onPress={() => openPurchaseModal(item)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              {/* El contenedor cuadrado estilo ícono de iOS */}
              <View style={[styles.appIconSquare, isMaxedOut && styles.appIconSquareDisabled]}>
                
                {/* Reemplazamos el Text por Image */}
                <Image source={item.icon} style={styles.appImageReal} />
                
                {isMaxedOut && (
                  <View style={styles.maxedBadge}>
                    <Text style={styles.maxedBadgeText}>LÍMITE</Text>
                  </View>
                )}
              </View>

              {/* Información debajo del ícono */}
              <Text style={styles.appGridName}>{item.name}</Text>
              <Text style={styles.appGridLimit}>
                {item.boughtToday} / {item.dailyLimit} min hoy
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* EL MODAL ESTILO BOTTOM SHEET */}
      <Modal
        visible={!!selectedApp}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedApp(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedApp(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalTitle}>¿Cuánto tiempo de {selectedApp?.name}?</Text>
            
            <View style={styles.timeOptionsRow}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity 
                  key={time}
                  style={[styles.timeOption, selectedTime === time && styles.timeOptionSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIconMedium} />
                  <Text style={[styles.timeOptionText, selectedTime === time && styles.timeOptionTextSelected]}>
                    {time} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                // Se bloquea si no hay dinero O si supera el límite de tiempo
                (braincells < (selectedApp ? (selectedApp.cost / selectedApp.timeGranted) * selectedTime : 0) || 
                (selectedApp && selectedApp.boughtToday + selectedTime > selectedApp.dailyLimit)) 
                && styles.confirmButtonDisabled
              ]} 
              onPress={confirmPurchase}
              disabled={braincells < (selectedApp ? (selectedApp.cost / selectedApp.timeGranted) * selectedTime : 0) || (selectedApp && selectedApp.boughtToday + selectedTime > selectedApp.dailyLimit)}
            >
              <Text style={styles.confirmButtonText}>Comprar por </Text>
              <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIconSmall} />
              <Text style={styles.confirmButtonText}>
                {selectedApp ? (selectedApp.cost / selectedApp.timeGranted) * selectedTime : 0}
              </Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F0F4F8' },
  headerContainer: { width: '100%', height: SCREEN_HEIGHT * 0.60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', backgroundColor: '#81C784' },
  heroBackground: { flex: 1, width: '100%' },
  floatingCoinBadge: { position: 'absolute', top: 70, right: 20, backgroundColor: 'rgba(0, 0, 0, 0.35)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  coinIcon: { width: 20, height: 20, marginRight: 6, transform: [{scale: 2}] },
  floatingCoinText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  avatar: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 350, height: 350, resizeMode: 'contain', zIndex: 5 },
  overlapCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, overflow: 'hidden', marginHorizontal: 20, marginTop: -50, zIndex: 10, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  shopIconLarge: { width: 28, height: 28, marginRight: 8, resizeMode: 'contain' },
  title: { fontSize: 28, fontFamily: 'Nunito_900Black', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', fontFamily: 'Nunito_700Bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 50 },
  appGridItem: { width: '45%', alignItems: 'center', marginBottom: 25 },
  appGridItemDisabled: { opacity: 0.5 },
  appIconSquare: { width: '100%', aspectRatio: 1, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6, marginBottom: 12, backgroundColor: 'transparent'},
  appIconSquareDisabled: { opacity: 0.4 },
  appIconEmoji: { fontSize: 55 },
  appGridName: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#333', textAlign: 'center' },
  appGridLimit: { fontSize: 12, color: '#888', fontFamily: 'Nunito_700Bold', marginTop: 2, textAlign: 'center' },
  maxedBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 3, borderColor: '#F0F4F8' },
  maxedBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  coinIconSmall: { width: 16, height: 16, marginHorizontal: 2, transform: [{scale: 2}] },
  appImageReal: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 24 },
  
  // NUEVOS ESTILOS PARA EL MODAL DE COMPRA
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 320, paddingBottom: 40 },
  modalDragIndicator: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 25, textAlign: 'center' },
  timeOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  timeOption: { borderWidth: 2, borderColor: '#F0F0F0', borderRadius: 20, paddingVertical: 15, paddingHorizontal: 10, alignItems: 'center', flex: 1, marginHorizontal: 5, backgroundColor: 'white' },
  timeOptionSelected: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  coinIconMedium: { width: 28, height: 28, marginBottom: 8, transform: [{scale: 2}] },
  timeOptionText: { fontSize: 14, fontWeight: 'bold', color: '#888' },
  timeOptionTextSelected: { color: '#4CAF50' },
  confirmButton: { backgroundColor: '#4CAF50', paddingVertical: 18, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  confirmButtonDisabled: { backgroundColor: '#BDBDBD' },
  confirmButtonText: { color: 'white', fontSize: 18, fontWeight: '900' },
});