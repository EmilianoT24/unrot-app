import { App } from '../store/useUnrotStore';

export const DEFAULT_APPS: App[] = [
  {
    id: '1',
    name: 'Instagram',
    cost: 50,
    timeGranted: 5,
    icon: require('../../assets/images/Instagram.png'),
    boughtToday: 0,
    dailyLimit: 60,
  },
  {
    id: '2',
    name: 'TikTok',
    cost: 50,
    timeGranted: 1,
    icon: require('../../assets/images/tiktok.png'),
    boughtToday: 0,
    dailyLimit: 60,
  },  
  {
    id: '3',
    name: 'YouTube',
    cost: 100,
    timeGranted: 15,
    icon: require('../../assets/images/youtube.png'),
    boughtToday: 0,
    dailyLimit: 120,
  }
];