import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, AppState, Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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



export default function HomeScreen() {

  const router = useRouter();

  const braincells = useUnrotStore((state) => state.braincells);

  const checkDailyReset = useUnrotStore ((state) => state.checkDailyReset);

  const completeHabit = useUnrotStore ((state) => state.completeHabit);

  const habits = useUnrotStore ((state) => state.habits);

  const unrotTimeToday = useUnrotStore((state) => state.unrotTimeToday);

  const undoHabit = useUnrotStore((state) => state.undoHabit);

 const lastLoginDate = useUnrotStore((state) => state.lastLoginDate);

useEffect(() => {
    // 1. Chequeo inicial cuando la pantalla se carga por primera vez
    checkDailyReset();

    // 2. Suscripción para detectar cuando la app vuelve del segundo plano
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // La app volvió al primer plano, volvemos a revisar la fecha
        checkDailyReset();
      }
    });

    // Limpieza de la suscripción cuando el componente se desmonte
    return () => {
      subscription.remove();
    };
  }, [lastLoginDate]);



  const getAvatarState = () => {

    const activeHabits = habits.filter(h => h.isActive);

    const allDone = activeHabits.length > 0 && activeHabits.every(h => h.completedToday >= h.dailyLimit);



    if (allDone) {

      return require('../../assets/images/brain-happy.png');

    }



    const hasDoneSomething = activeHabits.some(h => h.completedToday > 0);

    if (!hasDoneSomething && unrotTimeToday >= 1 && unrotTimeToday <60) {

      return require('../../assets/images/brain-sleep.png');

    }

   

    if (!hasDoneSomething && unrotTimeToday >= 60 && unrotTimeToday <=119) {

      return require('../../assets/images/brain-rot.png');

    }



    if(unrotTimeToday >= 120){

      return require('../../assets/images/brain-zombie.png');

    }

    return require('../../assets/images/brain-zen.png');

  };  

  const activeHabitsCount = habits.filter(h => h.isActive).length;



  return (

  <View style={styles.mainContainer}>

   

    <View style={styles.headerContainer}>

      <ImageBackground

          source={require('../../assets/images/principal-background.jpg')}

          style={styles.heroBackground}

          resizeMode="cover"

        >

       

        {/* Cambia View por BlurView y agrega tint="dark" */}

        <BlurView intensity={50} tint="dark" style={styles.floatingCoinBadge}>

          <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIcon} />

          <Text style={styles.floatingCoinText}>{braincells}</Text>

        </BlurView>



        <Image

          source={getAvatarState()}

          style={styles.avatar}

        />

      </ImageBackground>

    </View>



    <BlurView intensity={80} tint="light" style={styles.overlapCard}>
      <View style={{ flex: 1, marginRight: 15 }}>
        <Text style={styles.shopRowLabel}>Tiempo Rot Hoy</Text>
        <Text style={styles.shopRowTime}>{unrotTimeToday} min</Text>
        
        {/* LA NUEVA BARRA DE PROGRESO */}
        <View style={styles.progressBarBackground}>
           <View style={[
             styles.progressBarFill, 
             // Calculamos el ancho basado en el máximo de 120 mins
             { width: `${Math.min((unrotTimeToday / 120) * 100, 100)}%`, 
               // Cambia de color a rojo si te pasas de los 60 mins
               backgroundColor: unrotTimeToday > 60 ? '#FF5252' : '#4CAF50' 
             }
           ]} />
        </View>
      </View>
      
      <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/shop')}>
        <Image source={require('../../assets/images/shop-icon.png')} style={styles.shopIconSmall} />
        <Text style={styles.shopButtonText}>Tienda</Text>
      </TouchableOpacity>
    </BlurView>

    {/* <Text style={styles.activeCountLabel}>
      {activeHabitsCount} actividades en progreso hoy
    </Text>*/}

    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>

      <Text style={styles.activeCountLabel}>
      {activeHabitsCount} actividades en progreso hoy
    </Text>

      {habits

        .filter((item) => item.completedToday < item.dailyLimit && item.isActive)

        .map((item) => {

          const cat = categoryConfig[item.category] || categoryConfig['default'];

         

          return (

          <View key={item.id} style={styles.habitCardPremium}>

           

            <View style={styles.habitInfoRow}>

              <View style={styles.iconBox}>

                <Image source={cat.badge} style={styles.badgeImage} />

                </View>

             

              <View style={styles.habitTextContainer}>

                <Text style={styles.habitTitle}>{item.name}</Text>

                <Text style={styles.habitSubtitle}>Completado hoy: {item.completedToday} / {item.dailyLimit}</Text>

              </View>



              {item.streak > 0 && (

                <View style={styles.streakBadge}>

                  <Image

                    source={item.streak >= 10 ? require('../../assets/images/fire-purple.png') : require('../../assets/images/fire-red.png')}

                    style={styles.fireIcon}

                  />

                  <Text style={[styles.streakNumber, { color: item.streak >= 10 ? '#FFF' : '#333' }]}>

                    {item.streak}

                  </Text>

                </View>

              )}

            </View>



            <Pressable
              onPress={() => completeHabit(item.id)}
              onLongPress={() => {
                if (item.completedToday > 0) {
                  Alert.alert(
                    "Deshacer Hábito",
                    `¿Marcaste "${item.name}" por error? Esto te restará ${item.baseReward} Braincells.`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Deshacer", style: "destructive", onPress: () => undoHabit(item.id) }
                    ]
                  );
                }
              }}
              delayLongPress={500} // Medio segundo apretado
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: cat.main },
                // Si está presionado, aplica el estilo que lo hunde
                pressed && styles.actionButtonPressed 
              ]}
            >
              <View style={styles.buttonRow}>
                <Text style={styles.actionButtonText}>Completar + </Text>
                <Image source={require('../../assets/images/brain-coin.png')} style={styles.coinIconSmall} />
                <Text style={styles.actionButtonText}> {item.baseReward || 10}</Text>
              </View>
            </Pressable>



          </View>

        );

      })}

    </ScrollView>



    <TouchableOpacity style={styles.catalogButton} onPress={() => router.push('/activities')}>

  <View style={{flexDirection: 'row', alignItems: 'center'}}>

    <Image source={require('../../assets/images/activities-icon.png')} style={styles.catalogIcon} />

    <Text style={styles.catalogButtonText}>Actividades</Text>

  </View>

    </TouchableOpacity>

  </View>

);

}



const styles = StyleSheet.create({

  mainContainer: { flex: 1, backgroundColor: '#F0F4F8' },

  headerContainer: { width: '100%', height: SCREEN_HEIGHT * 0.60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', backgroundColor: '#81C784' },

  heroBackground: { flex: 1, width: '100%' },

  floatingCoinBadge: { position: 'absolute', top: 70, right: 20, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden'},

  coinIcon: { width: 20, height: 20, marginRight: 6, resizeMode: 'contain', transform: [{scale: 3}]},

  floatingCoinText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },

  avatar: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 350, height: 350, resizeMode: 'contain', zIndex: 5 },

  overlapCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, overflow: 'hidden', marginHorizontal: 20, marginTop: -40, zIndex: 10, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

  shopRowLabel: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 },

  shopRowTime: { fontSize: 24, fontFamily: 'Nunito_900Black', color: '#333' },

  shopButton: { backgroundColor: '#2a3175', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 5, borderBottomColor: 'rgba(0, 0, 0, 0.5)' },

  shopIconSmall: { width: 30, height: 30, marginRight: 10, resizeMode: 'contain' },

  shopButtonText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 18, transform: [{scale: 1.15}]},

  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  habitCardPremium: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },

  habitInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },

  habitTextContainer: { flex: 1 },

  habitTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#333', marginBottom: 4 },

  habitSubtitle: { fontSize: 14, color: '#888', fontFamily: 'Nunito_700Bold' },

  actionButton: { paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: 'rgba(0, 0, 0, 0.2)', marginTop: 5 },

  actionButtonPressed: { borderBottomWidth: 0, transform: [{ translateY: 5 }]},
  
  buttonRow: { flexDirection: 'row', alignItems: 'center' },

  coinIconSmall: { width: 16, height: 16, marginHorizontal: 2, transform: [{scale: 2.5}] },

  actionButtonText: { color: 'white', fontSize: 16, fontFamily: 'Nunito_800ExtraBold', transform: [{scale: 1.05}] },

  streakBadge: { justifyContent: 'center', alignItems: 'center', width: 35, height: 35 },

  fireIcon: { width: 35, height: 35, resizeMode: 'contain' },

  streakNumber: { position: 'absolute', top: 16, fontSize: 12, fontWeight: '900' },

  catalogButton: { backgroundColor: '#E0E0E0', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 20, marginHorizontal: 20 },

  catalogIcon: { width: 20, height: 20, marginRight: 35, resizeMode: 'contain', transform: [{scale: 2.5}] },

  catalogButtonText: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#555', transform: [{scale: 1.3}]},

  iconBox: {width: 50, height: 50, marginRight: 15,},

  badgeImage: {width: 50, height: 50, resizeMode: 'contain',},

  progressBarBackground: {height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 5, marginTop: 8, width: '100%', overflow: 'hidden',},

  progressBarFill: { height: '100%', borderRadius: 5, },

  activeCountLabel: { fontSize: 12, color: '#999', fontFamily: 'Nunito_700Bold', marginLeft: 25, marginBottom: 10, marginTop: -10},
}); 

