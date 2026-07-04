import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_APPS } from '../data/defaultApps';
import { DEFAULT_HABITS } from '../data/defaultHabits';

// Helper: Compara una fecha en texto y nos dice si fue exactamente ayer
const isYesterday = (lastDateString: string | null) => {
  if (!lastDateString) return false;
  const lastDate = new Date(lastDateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); // Le restamos 1 día a hoy
  return lastDate.toDateString() === yesterday.toDateString();
};

// 1. EL MOLDE DE LOS HÁBITOS
export interface Habit {
  id: string;
  category: string;
  name: string;
  baseReward: number;
  completedToday: number;
  dailyLimit: number;
  streak: number;
  lastCompletedDate: string | null;
  isActive: boolean;
}

// 2. EL MOLDE DE LAS APPS
export interface App {
  id: string;
  name: string;
  cost: number;
  timeGranted: number;
  boughtToday: number;
  dailyLimit: number;
  icon: any;
}

// 3. EL MOLDE DE NUESTRA MEMORIA COMPLETA
interface UnrotState {
  braincells: number;
  unrotTimeToday: number; // Nuevo: Tiempo comprado hoy
  lastLoginDate: string;  // Nuevo: Para saber si ya es otro día
  habits: Habit[];        // Nuevo: Una lista (array) de hábitos
  apps: App[];
  // Acciones
  addBraincells: (amount: number) => void;
  checkDailyReset: () => void; // Función para limpiar la casa a medianoche
  completeHabit: (id: string) => void;
  buyAppTime: (id: string, customTime: number, customCost: number) => void;
  toggleHabitActive: (id: string) => void;
  setAllHabitsActive: (status: boolean) => void;
  devResetDay: () => void;
  addCustomHabit: (name: string, reward: number) => void;
  deleteHabit: (id: string) => void;
  undoHabit: (id: string) => void;
}

// 4. EL MOTOR (ZUSTAND)
export const useUnrotStore = create<UnrotState>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      braincells: 0,
      unrotTimeToday: 0,
      lastLoginDate: new Date().toDateString(), // Guarda la fecha de hoy por defecto
      habits: DEFAULT_HABITS,
      apps: DEFAULT_APPS,

      // FUNCIÓN 1: Sumar monedas
      addBraincells: (amount) => 
        set((state) => ({ braincells: state.braincells + amount })),

      // FUNCIÓN 2: El vigilante del nuevo día
      checkDailyReset: () => {
        const today = new Date().toDateString();
        const lastLogin = get().lastLoginDate;

        if (today !== lastLogin) {
          // ¡ES UN DÍA NUEVO!
          console.log("¡Día nuevo detectado! Limpiando variables...");
                   
          set((state) => ({
            unrotTimeToday : 0,
            lastLoginDate: today,
            habits: state.habits.map((habit) => {
              return {
                ...habit,
                completedToday: 0
              };
            })
          }));

          const habits = [
            {id: 1, name: 'Ejercicio', completedToday: 0 },
          ];

          const newdayHabits = habits.map((habit) => {
            return {
              ...habit,
              completedToday: 0
            };
          });

          // Finalmente, actualizamos la fecha de inicio de sesión
          set({ lastLoginDate: today });
        }
      },
      // FUNCIÓN 3: Limite Diario
      completeHabit: (id) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === id);

        if (habit && habit.completedToday < habit.dailyLimit) {
          set((state) => ({
            braincells: state.braincells + habit.baseReward,

            habits: state.habits.map((h) =>{
              if(h.id === id) {
                let newStreak = h.streak;

                if (h.completedToday === 0) {
                  if(isYesterday(h.lastCompletedDate)){
                    newStreak = h.streak + 1
                  } else {
                    newStreak = 1
                  }
                }
                return { ...h, completedToday: h.completedToday + 1,
                  streak: newStreak,
                  lastCompletedDate: new Date().toDateString()
                };                
              }
              return h;
            })
          })); 
        } else {
          console.log("Limite diario alcanzado");
        }
      }, 
      //FUNCION 4: COMPRA DE APPS
      buyAppTime: (id, customTime, customCost) => {
        const state = get();
        const app = state.apps.find((h) => h.id === id);

        // Verificamos usando el customCost en lugar del app.cost fijo
        if (app && customCost <= state.braincells && app.boughtToday < app.dailyLimit) {
          set((state) => ({
            // Restamos el costo personalizado
            braincells: state.braincells - customCost,
                          
            // Sumamos el tiempo personalizado
            unrotTimeToday: state.unrotTimeToday + customTime,

            apps: state.apps.map((a) => {
              if (a.id === id) {
                return { ...a, boughtToday: a.boughtToday + customTime };
              }
              return a;          
      })
    }));
  } else {
    console.log("No Disponible Todavia");
  }
},
      //Funcion 5: Seleccion de Habitos
      toggleHabitActive: (id) => {        
          set((state)=> ({ 
            
            habits: state.habits.map((h) => {
              if(h.id === id){
                return { ...h, isActive: !h.isActive};
              }
              return h;
            })
        }));         
      },

      setAllHabitsActive: (status) => {
        set((state) => ({
          habits: state.habits.map((h) => ({
            ...h,
            isActive: status
          }))
        }));
      },

      // Agrega esto debajo de tu función setAllHabitsActive
      addCustomHabit: (name, reward) => {
        set((state) => {
          const newHabit = {
            id: Date.now().toString(), // Generamos un ID único con la fecha
            category: 'Extras',
            name: name,
            baseReward: reward,
            completedToday: 0,
            dailyLimit: 1, // Por defecto se hace 1 vez al día
            streak: 0,
            lastCompletedDate: null,
            isActive: true, // Nace encendido
          };
          return { habits: [...state.habits, newHabit] };
        });
      },

      deleteHabit: (id) => {
        set((state) => ({
          // filter crea una nueva lista excluyendo el que tenga el ID que queremos borrar
          habits: state.habits.filter((h) => h.id !== id)
        }));
      },

      undoHabit: (id) => {
        set((state) => {
          let costToDeduct = 0;
          
          const updatedHabits = state.habits.map((h) => {
            // Solo podemos deshacer si realmente hemos completado al menos 1 hoy
            if (h.id === id && h.completedToday > 0) {
              costToDeduct = h.baseReward;
              return { ...h, completedToday: h.completedToday - 1 };
            }
            return h;
          });

          return { 
            habits: updatedHabits,
            // Restamos las monedas asegurándonos de no quedar en negativos
            braincells: Math.max(0, state.braincells - costToDeduct)
          };
        });
      },

      //Funcion REINICIO PRUEBA      
      devResetDay: () => {
        set({
          unrotTimeToday: 0,
          habits: DEFAULT_HABITS, 
          apps: DEFAULT_APPS,
        });
      },
  }),
    {
      name: 'unrot-storage-v7',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);