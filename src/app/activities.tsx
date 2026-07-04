import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Alert, Dimensions, Image, ImageBackground, Keyboard, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useUnrotStore } from '../store/useUnrotStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const categoryConfig: Record<string, { badge: any, main: string, bg: string }> = {
  'Salud': { badge: require('../../assets/images/badge-salud.png'), main: '#4CAF50', bg: '#E8F5E9' },    
  'Mente': { badge: require('../../assets/images/badge-mente.png'), main: '#2196F3', bg: '#E3F2FD' },    
  'Físico': { badge: require('../../assets/images/badge-fisico.png'), main: '#FF9800', bg: '#FFF3E0' },   
  'Creatividad': { badge: require('../../assets/images/badge-arte.png'), main: '#9C27B0', bg: '#F3E5F5' },
  'Cuidado': { badge: require('../../assets/images/badge-cuidado.png'), main: '#E91E63', bg: '#FCE4EC' },
  'Productividad': { badge: require('../../assets/images/badge-productividad.png'), main: '#F44336', bg: '#FFEBEE' },
  'Extras': { badge: require('../../assets/images/badge-mente.png'), main: '#607D8B', bg: '#ECEFF1' },
  'default': { badge: require('../../assets/images/badge-salud.png'), main: '#9E9E9E', bg: '#F5F5F5' } 
};

export default function ActivitiesScreen() {
  const habits = useUnrotStore((state) => state.habits);
  const toggleHabitActive = useUnrotStore((state) => state.toggleHabitActive);
  const devResetDay = useUnrotStore((state) => state.devResetDay);
  const setAllHabitsActive = useUnrotStore((state) => state.setAllHabitsActive);
  const addCustomHabit = useUnrotStore((state) => state.addCustomHabit);
  const deleteHabit = useUnrotStore((state) => state.deleteHabit);

  const [isModalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitReward, setNewHabitReward] = useState('');

  const isAnyActive = habits.some((h) => h.isActive);

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCats(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Agrupar los hábitos por categoría automáticamente
  const groupedHabits = habits.reduce((acc, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = [];
    }
    acc[habit.category].push(habit);
    return acc;
  }, {} as Record<string, typeof habits>);

  const handleSaveHabit = () => {
    if (newHabitName.trim() === '' || newHabitReward.trim() === '') {
      Alert.alert('Faltan datos', 'Por favor llena todos los campos.');
      return;
    }

    const rewardNumber = parseInt(newHabitReward, 10);
    if (isNaN(rewardNumber) || rewardNumber <= 0) {
      Alert.alert('Error', 'La recompensa debe ser un número válido mayor a 0.');
      return;
    }

    addCustomHabit(newHabitName, rewardNumber);

    setNewHabitName('');
    setNewHabitReward('');
    setModalVisible(false);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Eliminar Actividad",
      `¿Estás seguro de que quieres borrar "${name}" de tu catálogo?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", // "destructive" pone el botón en rojo en iOS
          onPress: () => deleteHabit(id) 
        }
      ]
    );
  };
  
 return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <ImageBackground source={require('../../assets/images/activities-background.jpg')} style={styles.heroBackground} resizeMode="cover">
          <Image source={require('../../assets/images/brain-activities.png')} style={styles.avatar} />
        </ImageBackground>
      </View>

    <BlurView intensity={80} tint="light" style={styles.overlapCard}>
            <View>
              {/* Quitamos el emoji y dejamos solo el texto */}
              <Text style={styles.title}>Catálogo</Text>
              <Text style={styles.subtitle}>Enciende las que harás hoy.</Text>
            </View>
            
        {/* BOTÓN DE RESET DESACTIVADO POR SEGURIDAD:
        <TouchableOpacity style={styles.devButton} onPress={() => { devResetDay(); alert("¡Día reiniciado!"); }}>
          <Text style={styles.devButtonText}>RESET</Text>
        </TouchableOpacity>
        */}
          </BlurView>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {/* Aquí iteramos sobre las categorías agrupadas en lugar de todos los hábitos a la vez */}
        {Object.keys(groupedHabits).map((categoryName) => {
          const catConfig = categoryConfig[categoryName] || categoryConfig['default'];
          const isExpanded = expandedCats[categoryName];
          const categoryHabits = groupedHabits[categoryName];

          return (
            <View key={categoryName} style={styles.categoryContainer}>
              
              {/* HEADER DEL DROPDOWN */}
              <TouchableOpacity 
                style={[styles.categoryHeader, { backgroundColor: catConfig.bg }]} 
                onPress={() => toggleCategory(categoryName)}
              >
                <Text style={[styles.categoryTitle, { color: catConfig.main }]}>
                  {categoryName} ({categoryHabits.length})
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: catConfig.main }}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {/* LISTA DE HÁBITOS (Solo se muestra si está expandido) */}
              {isExpanded && (
                <View style={styles.categoryItems}>
                  {categoryHabits.map((item) => (
                    // Cambiamos el View exterior por un Pressable
                    <Pressable 
                      key={item.id} 
                      style={styles.catalogCard}
                      onLongPress={() => confirmDelete(item.id, item.name)}
                      delayLongPress={500} // Medio segundo de presión para activarlo
                    >
                      <View style={[styles.cardLeft, { flex: 1 }]}>
                        <View style={styles.iconBox}>
                          <Image source={catConfig.badge} style={styles.badgeImage} />
                        </View>
                        
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.name}
                          </Text>
                          
                          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                            <Text style={styles.cardReward}>Da </Text>
                            <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIconSmall} />
                            <Text style={styles.cardReward}> {item.baseReward} BC</Text>
                          </View>
                        </View>
                      </View>

                      <Switch 
                        value={item.isActive} 
                        onValueChange={() => toggleHabitActive(item.id)} 
                        trackColor={{ false: '#D3D3D3', true: '#4CAF50' }} 
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <Pressable
        onPress={() => setAllHabitsActive(!isAnyActive)}
        style={({ pressed }) => [
          styles.masterToggleButton,
          // Si hay alguna prendida, el botón es rojo (para apagar). Si no, es verde (para prender).
          { backgroundColor: isAnyActive ? '#FF5252' : '#4CAF50' },
          pressed && styles.masterToggleButtonPressed
        ]}
      >
        <Text style={styles.masterToggleText}>
          {isAnyActive ? 'APAGAR TODAS (OFF)' : 'ENCENDER TODAS (ON)'}
        </Text>
      </Pressable>  
      <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.masterToggleButton, 
            { backgroundColor: '#2196F3', marginTop: 15 },
            pressed && styles.masterToggleButtonPressed
          ]}
        >
          <Text style={styles.masterToggleText}>
            + AGREGAR ACTIVIDAD EXTRA
          </Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          {/* AÑADIMOS EL DETECTOR DE TOQUES AQUÍ */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            
            <View style={styles.modalContent}>
              <View style={styles.modalDragIndicator} />
              <Text style={styles.modalTitle}>Nueva Actividad</Text>

            <Text style={styles.inputLabel}>¿Qué actividad harás?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Estudiar para Examen"
              placeholderTextColor="#999"
              value={newHabitName}
              onChangeText={setNewHabitName}
            />

            <Text style={styles.inputLabel}>Recompensa (Braincells)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 20"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newHabitReward}
              onChangeText={setNewHabitReward}
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: '#F0F4F8' }]}
              >
                <Text style={[styles.modalButtonText, { color: '#555' }]}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveHabit}
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </Pressable>
          </View>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F0F4F8' },
  headerContainer: { width: '100%', height: SCREEN_HEIGHT * 0.60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', backgroundColor: '#81C784' },
  heroBackground: { flex: 1, width: '100%' },
  avatar: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 350, height: 350, resizeMode: 'contain', zIndex: 5 },
  overlapCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, overflow: 'hidden', marginHorizontal: 20, marginTop: -50, zIndex: 10, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 28, fontFamily: 'Nunito_900Black', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', fontFamily: 'Nunito_700Bold' },
  devButton: { backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  devButtonText: { color: '#95A5A6', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  catalogCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#333' },
  cardReward: { fontSize: 14, color: '#888' },
  coinIconSmall: { width: 14, height: 14, marginHorizontal: 2, transform: [{scale: 2.5}] },
  iconBox: { width: 50, height: 50, marginRight: 15 },
  badgeImage: { width: 50, height: 50, resizeMode: 'contain' },
  categoryContainer: { marginBottom: 15 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 10 },
  categoryTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold'},
  categoryItems: { paddingLeft: 5 },
  masterToggleButton: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 10, marginBottom: 35, borderBottomWidth: 5, borderBottomColor: 'rgba(0, 0, 0, 0.25)', },
  masterToggleButtonPressed: { borderBottomWidth: 0, transform: [{ translateY: 5 }], },
  masterToggleText: { color: 'white', fontSize: 16, fontFamily: 'Nunito_900Black', letterSpacing: 1, },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 400, paddingBottom: 40 },
  modalDragIndicator: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontFamily: 'Nunito_900Black', color: '#333', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#666', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#F0F4F8', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16, fontFamily: 'Nunito_700Bold', marginBottom: 20, color: '#333' },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5 },
  modalButtonText: { color: 'white', fontSize: 16, fontFamily: 'Nunito_900Black' },
});