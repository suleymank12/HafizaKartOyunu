import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export type Lang = 'tr' | 'en';

const LANG_KEY = 'app_language';

let currentLang: Lang = 'tr';

const tr: Record<string, string> = {
  // HomeScreen
  'home.title': 'HAFIZA KARTI',
  'home.subtitle': 'OYUNU',
  'home.description': 'Kartları eşleştir, combo yap, yüksek skor kır.',
  'home.start': 'OYUNA BAŞLA',
  'home.market': 'MARKET',
  'home.achievements': 'BAŞARIMLAR',
  'home.stats': 'İSTATİSTİKLER',
  'home.settings': 'AYARLAR',
  'home.privacy': 'Gizlilik Politikası',

  // Tutorial
  'tutorial.title': 'NASIL OYNANIR?',
  'tutorial.step1': '1. Bir zorluk seviyesi seç',
  'tutorial.step2': '2. Kartlara dokunarak çevir',
  'tutorial.step3': '3. Aynı sembolleri eşleştir',
  'tutorial.step4': '4. Ardışık eşleşmeler = COMBO!',
  'tutorial.step5': '5. Süre dolmadan tüm kartları eşleştir',
  'tutorial.tip': 'Marketten tema ve bonus satın alabilirsin. Günlük ödüllerini toplamayı unutma!',
  'tutorial.ok': 'ANLADIM',

  // Daily Reward
  'reward.weekly': 'HAFTALIK BONUS!',
  'reward.daily': 'GÜNLÜK ÖDÜL!',
  'reward.streak': '. gün seri',
  'reward.balance': 'bakiye',
  'reward.claim': 'TOPLA',

  // Game
  'game.difficulty': 'ZORLUK SEVİYESİ',
  'game.chooseDifficulty': 'Bir zorluk seviyesi seç',
  'game.easy': 'KOLAY',
  'game.medium': 'ORTA',
  'game.hard': 'ZOR',
  'game.pairs': 'çift',
  'game.seconds': 'saniye',
  'game.score': 'SKOR',
  'game.moves': 'HAMLE',
  'game.time': 'SÜRE',
  'game.combo': 'COMBO!',
  'game.paused': 'DURAKLATILDI',
  'game.sound': 'SES',
  'game.haptic': 'TİTREŞİM',
  'game.resume': 'DEVAM ET',
  'game.newGame': 'YENİ OYUN',
  'game.home': 'ANA SAYFA',
  'game.useBonus': 'BONUS KULLAN',
  'game.back': 'GERİ DÖN',
  'game.jokerActive': 'JOKER AKTIF - KARTLARI EZBERLE!',
  'game.exitTitle': 'OYUNDAN ÇIK',
  'game.exitDesc': 'Oyundan çıkmak istediğine emin misin? İlerlemen kaydedilmeyecek.',
  'game.exit': 'ÇIK',
  'game.cancel': 'İPTAL',

  // Score
  'score.win': 'TEBRİKLER!',
  'score.lose': 'SÜRE DOLDU!',
  'score.earned': 'KAZANILAN BAKİYE',
  'score.difficulty': 'ZORLUK',
  'score.totalScore': 'TOPLAM PUAN',
  'score.balance': 'BAKİYE',
  'score.history': 'GEÇMİŞ SKORLAR',

  // Market
  'market.title': 'MARKET',
  'market.balance': 'BAKİYE',
  'market.balanceDesc': 'Harcayabileceğin puan',
  'market.cardThemes': 'KART TEMALARI',
  'market.bgThemes': 'ARKA PLAN TEMALARI',
  'market.consumables': 'TEK KULLANIMLIK',
  'market.buy': 'SATIN AL',
  'market.select': 'SEÇ',
  'market.selected': 'SEÇİLİ',
  'market.points': 'puan',
  'market.insufficient': 'YETERSIZ PUAN',
  'market.needMore': 'puan daha kazanman gerekiyor.',
  'market.needed': 'Gerekli',
  'market.ok': 'TAMAM',

  // Achievements
  'achievements.title': 'BAŞARIMLAR',
  'achievements.completed': 'TAMAM',
  'achievements.locked': 'KİLİTLİ',

  // Stats
  'stats.title': 'İSTATİSTİKLER',
  'stats.general': 'GENEL',
  'stats.totalGames': 'Toplam Oyun',
  'stats.wins': 'Kazanılan',
  'stats.winRate': 'Kazanma Oranı',
  'stats.highScore': 'En Yüksek Skor',
  'stats.bestCombo': 'En İyi Combo',
  'stats.economy': 'EKONOMİ',
  'stats.totalEarned': 'Toplam Kazanılan',
  'stats.totalSpent': 'Toplam Harcanan',
  'stats.currentBalance': 'Mevcut Bakiye',
  'stats.games': 'Oyun',
  'stats.winning': 'Kazanma',
  'stats.avgScore': 'Ort. Skor',
  'stats.bestScore': 'En İyi Skor',
  'stats.empty': 'Henüz oyun oynamadın.',
  'stats.emptyDesc': 'Oynadıkça istatistiklerin burada görünecek!',

  // Settings
  'settings.title': 'AYARLAR',
  'settings.soundHaptic': 'SES & TİTREŞİM',
  'settings.soundEffects': 'Ses Efektleri',
  'settings.soundDesc': 'Oyun sesleri',
  'settings.haptic': 'Titreşim',
  'settings.hapticDesc': 'Dokunmatik geri bildirim',
  'settings.language': 'DİL',
  'settings.data': 'VERİ',
  'settings.clearScores': 'Skor Geçmişini Temizle',
  'settings.clearDesc': 'Tüm oyun kayıtlarını sil',
  'settings.about': 'HAKKINDA',
  'settings.version': 'Versiyon',
  'settings.developer': 'Geliştirici',
  'settings.confirmTitle': 'EMİN MİSİN?',
  'settings.confirmDesc': 'Tüm skor geçmişin silinecek. Bu işlem geri alınamaz.',
  'settings.delete': 'SİL',
  'settings.cleared': 'Skor geçmişi temizlendi.',
  'settings.success': 'Başarılı',

  // Privacy
  'privacy.title': 'GİZLİLİK POLİTİKASI',
  'privacy.appTitle': 'Flipnova Gizlilik Politikası',
  'privacy.updated': 'Son güncelleme: Mart 2026',
  'privacy.intro': 'Flipnova hafıza kartı oyunu, kullanıcılarının gizliliğine saygı duyar.',
  'privacy.dataTitle': 'Toplanan Veriler',
  'privacy.dataDesc': 'Bu uygulama hiçbir kişisel veri toplamaz. Oyun skorları ve ayarlar yalnızca cihazınızda yerel olarak saklanır (AsyncStorage).',
  'privacy.shareTitle': 'Üçüncü Taraf Paylaşımı',
  'privacy.shareDesc': 'Hiçbir veri üçüncü taraflarla paylaşılmaz.',
  'privacy.contactTitle': 'İletişim',
  'privacy.contactDesc': 'Sorularınız için GitHub üzerinden iletişime geçebilirsiniz.\ngithub.com/suleymank12',
  'privacy.close': 'KAPAT',

  // Card
  'card.closed': 'Kapalı kart',
  'card.hint': 'Kartı çevirmek için dokunun',

  // Difficulty names (for display)
  'diff.easy': 'KOLAY',
  'diff.medium': 'ORTA',
  'diff.hard': 'ZOR',

  // Achievement names
  'ach.first_game.name': 'İlk Oyun',
  'ach.first_game.desc': 'İlk oyununu tamamla',
  'ach.combo_5.name': '5 Combo',
  'ach.combo_5.desc': '5 combo yap',
  'ach.combo_10.name': '10 Combo',
  'ach.combo_10.desc': '10 combo yap',
  'ach.games_50.name': '50 Oyun',
  'ach.games_50.desc': '50 oyun tamamla',
  'ach.perfect_10.name': 'Mükemmel x10',
  'ach.perfect_10.desc': 'Tüm kartları 10 kez eşleştir',
  'ach.first_purchase.name': 'İlk Alışveriş',
  'ach.first_purchase.desc': 'Marketten ilk alışverişini yap',
  'achievements.completed_count': 'tamamlandı',

  // Market theme names
  'theme.neon_blue': 'Neon Mavi',
  'theme.fire_red': 'Kırmızı Ateş',
  'theme.green_nature': 'Yeşil Doğa',
  'theme.gold_luxury': 'Altın Lüks',
  'theme.ice_blue': 'Buz Mavisi',
  'theme.neon_pink': 'Neon Pembe',
  'theme.purple_galaxy': 'Mor Galaksi',
  'theme.ocean': 'Okyanus',
  'theme.sunset': 'Gün Batımı',
  'theme.forest': 'Orman',
  'theme.midnight': 'Gece Yarısı',
  'theme.cherry': 'Vişne',
  'theme.arctic': 'Kutup',
  'theme.volcanic': 'Volkanik',
  'consumable.extra_time': 'Ekstra Süre',
  'consumable.extra_time.desc': '+30 saniye bonus',
  'consumable.joker': 'Joker Kartı',
  'consumable.joker.desc': 'Tüm kartları 2 sn gösterir',

  // Common
  'common.loading': 'Yükleniyor...',
  'common.back': 'GERİ DÖN',
  'common.balance': 'bakiye',
};

const en: Record<string, string> = {
  // HomeScreen
  'home.title': 'MEMORY CARD',
  'home.subtitle': 'GAME',
  'home.description': 'Match cards, make combos, set high scores.',
  'home.start': 'START GAME',
  'home.market': 'MARKET',
  'home.achievements': 'ACHIEVEMENTS',
  'home.stats': 'STATISTICS',
  'home.settings': 'SETTINGS',
  'home.privacy': 'Privacy Policy',

  // Tutorial
  'tutorial.title': 'HOW TO PLAY?',
  'tutorial.step1': '1. Choose a difficulty level',
  'tutorial.step2': '2. Tap cards to flip them',
  'tutorial.step3': '3. Match identical symbols',
  'tutorial.step4': '4. Consecutive matches = COMBO!',
  'tutorial.step5': '5. Match all cards before time runs out',
  'tutorial.tip': 'Buy themes and bonuses from the market. Don\'t forget to collect daily rewards!',
  'tutorial.ok': 'GOT IT',

  // Daily Reward
  'reward.weekly': 'WEEKLY BONUS!',
  'reward.daily': 'DAILY REWARD!',
  'reward.streak': ' day streak',
  'reward.balance': 'coins',
  'reward.claim': 'CLAIM',

  // Game
  'game.difficulty': 'DIFFICULTY LEVEL',
  'game.chooseDifficulty': 'Choose a difficulty level',
  'game.easy': 'EASY',
  'game.medium': 'MEDIUM',
  'game.hard': 'HARD',
  'game.pairs': 'pairs',
  'game.seconds': 'seconds',
  'game.score': 'SCORE',
  'game.moves': 'MOVES',
  'game.time': 'TIME',
  'game.combo': 'COMBO!',
  'game.paused': 'PAUSED',
  'game.sound': 'SOUND',
  'game.haptic': 'HAPTIC',
  'game.resume': 'RESUME',
  'game.newGame': 'NEW GAME',
  'game.home': 'HOME',
  'game.useBonus': 'USE BONUS',
  'game.back': 'GO BACK',
  'game.jokerActive': 'JOKER ACTIVE - MEMORIZE THE CARDS!',
  'game.exitTitle': 'QUIT GAME',
  'game.exitDesc': 'Are you sure you want to quit? Your progress will not be saved.',
  'game.exit': 'QUIT',
  'game.cancel': 'CANCEL',

  // Score
  'score.win': 'CONGRATULATIONS!',
  'score.lose': 'TIME\'S UP!',
  'score.earned': 'COINS EARNED',
  'score.difficulty': 'DIFFICULTY',
  'score.totalScore': 'TOTAL SCORE',
  'score.balance': 'BALANCE',
  'score.history': 'PAST SCORES',

  // Market
  'market.title': 'MARKET',
  'market.balance': 'BALANCE',
  'market.balanceDesc': 'Points you can spend',
  'market.cardThemes': 'CARD THEMES',
  'market.bgThemes': 'BACKGROUND THEMES',
  'market.consumables': 'CONSUMABLES',
  'market.buy': 'BUY',
  'market.select': 'SELECT',
  'market.selected': 'ACTIVE',
  'market.points': 'pts',
  'market.insufficient': 'NOT ENOUGH POINTS',
  'market.needMore': 'more points needed.',
  'market.needed': 'Required',
  'market.ok': 'OK',

  // Achievements
  'achievements.title': 'ACHIEVEMENTS',
  'achievements.completed': 'DONE',
  'achievements.locked': 'LOCKED',

  // Stats
  'stats.title': 'STATISTICS',
  'stats.general': 'GENERAL',
  'stats.totalGames': 'Total Games',
  'stats.wins': 'Wins',
  'stats.winRate': 'Win Rate',
  'stats.highScore': 'High Score',
  'stats.bestCombo': 'Best Combo',
  'stats.economy': 'ECONOMY',
  'stats.totalEarned': 'Total Earned',
  'stats.totalSpent': 'Total Spent',
  'stats.currentBalance': 'Current Balance',
  'stats.games': 'Games',
  'stats.winning': 'Winning',
  'stats.avgScore': 'Avg. Score',
  'stats.bestScore': 'Best Score',
  'stats.empty': 'No games played yet.',
  'stats.emptyDesc': 'Your stats will appear here as you play!',

  // Settings
  'settings.title': 'SETTINGS',
  'settings.soundHaptic': 'SOUND & HAPTIC',
  'settings.soundEffects': 'Sound Effects',
  'settings.soundDesc': 'Game sounds',
  'settings.haptic': 'Haptic',
  'settings.hapticDesc': 'Touch feedback',
  'settings.language': 'LANGUAGE',
  'settings.data': 'DATA',
  'settings.clearScores': 'Clear Score History',
  'settings.clearDesc': 'Delete all game records',
  'settings.about': 'ABOUT',
  'settings.version': 'Version',
  'settings.developer': 'Developer',
  'settings.confirmTitle': 'ARE YOU SURE?',
  'settings.confirmDesc': 'All your score history will be deleted. This cannot be undone.',
  'settings.delete': 'DELETE',
  'settings.cleared': 'Score history cleared.',
  'settings.success': 'Success',

  // Privacy
  'privacy.title': 'PRIVACY POLICY',
  'privacy.appTitle': 'Flipnova Privacy Policy',
  'privacy.updated': 'Last updated: March 2026',
  'privacy.intro': 'Flipnova memory card game respects the privacy of its users.',
  'privacy.dataTitle': 'Data Collected',
  'privacy.dataDesc': 'This app does not collect any personal data. Game scores and settings are stored only locally on your device (AsyncStorage).',
  'privacy.shareTitle': 'Third Party Sharing',
  'privacy.shareDesc': 'No data is shared with third parties.',
  'privacy.contactTitle': 'Contact',
  'privacy.contactDesc': 'For questions, reach out via GitHub.\ngithub.com/suleymank12',
  'privacy.close': 'CLOSE',

  // Card
  'card.closed': 'Hidden card',
  'card.hint': 'Tap to flip the card',

  // Difficulty names
  'diff.easy': 'EASY',
  'diff.medium': 'MEDIUM',
  'diff.hard': 'HARD',

  // Achievement names
  'ach.first_game.name': 'First Game',
  'ach.first_game.desc': 'Complete your first game',
  'ach.combo_5.name': '5 Combo',
  'ach.combo_5.desc': 'Get a 5 combo',
  'ach.combo_10.name': '10 Combo',
  'ach.combo_10.desc': 'Get a 10 combo',
  'ach.games_50.name': '50 Games',
  'ach.games_50.desc': 'Complete 50 games',
  'ach.perfect_10.name': 'Perfect x10',
  'ach.perfect_10.desc': 'Match all cards 10 times',
  'ach.first_purchase.name': 'First Purchase',
  'ach.first_purchase.desc': 'Make your first purchase from the market',
  'achievements.completed_count': 'completed',

  // Market theme names
  'theme.neon_blue': 'Neon Blue',
  'theme.fire_red': 'Fire Red',
  'theme.green_nature': 'Green Nature',
  'theme.gold_luxury': 'Gold Luxury',
  'theme.ice_blue': 'Ice Blue',
  'theme.neon_pink': 'Neon Pink',
  'theme.purple_galaxy': 'Purple Galaxy',
  'theme.ocean': 'Ocean',
  'theme.sunset': 'Sunset',
  'theme.forest': 'Forest',
  'theme.midnight': 'Midnight',
  'theme.cherry': 'Cherry',
  'theme.arctic': 'Arctic',
  'theme.volcanic': 'Volcanic',
  'consumable.extra_time': 'Extra Time',
  'consumable.extra_time.desc': '+30 seconds bonus',
  'consumable.joker': 'Joker Card',
  'consumable.joker.desc': 'Shows all cards for 2 sec',

  // Common
  'common.loading': 'Loading...',
  'common.back': 'GO BACK',
  'common.balance': 'coins',
};

const translations: Record<Lang, Record<string, string>> = { tr, en };

export const t = (key: string): string => {
  return translations[currentLang][key] || key;
};

export const tOr = (key: string, fallback: string): string => {
  const val = translations[currentLang][key];
  return val && val !== key ? val : fallback;
};

export const getCurrentLang = (): Lang => currentLang;

export const setLanguage = async (lang: Lang): Promise<void> => {
  currentLang = lang;
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    if (__DEV__) console.warn('i18n hatası:', e);
  }
};

export const loadLanguage = async (): Promise<Lang> => {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'tr') {
      currentLang = saved;
      return saved;
    }
    // Cihaz diline göre otomatik seçim
    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode;
    if (deviceLang === 'en') {
      currentLang = 'en';
    } else {
      currentLang = 'tr';
    }
    return currentLang;
  } catch (e) {
    if (__DEV__) console.warn('i18n hatası:', e);
    return 'tr';
  }
};
