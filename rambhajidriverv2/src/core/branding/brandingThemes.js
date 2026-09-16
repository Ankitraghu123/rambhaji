// src/core/branding/brandingThemes.js
// Dynamic themes configuration matching calendar events and Remote Config definitions.

export const DEFAULT_THEME = {
  id: 'default',
  name: 'Corporate Logistics',
  colors: {
    primary: '#00B4D8',       // Sky Blue / Electric Cyan
    secondary: '#E024E3',     // Neon Magenta Pink
    tertiary: '#1D4ED8',      // Royal Electric Blue
    gradient: ['#1D4ED8', '#00B4D8', '#E024E3'], // 3-Color Gradient
    background: '#F0F7FF',    // Soft Ice Blue Background
    surface: '#FFFFFF',       // Glassmorphism Light Surface
    text: '#0F172A',          // Primary Dark Text
    subtext: '#64748B',
    border: '#00B4D8',        // Sky Blue Border
    headerBg: '#F0F7FF',
    accent: '#E024E3',        // Neon Magenta Pink Accent
    skyBlue: '#00B4D8',
    magentaPink: '#E024E3',
    royalBlue: '#1D4ED8',
  },
  logo: {
    text: 'Logistics Partner',
    emoji: '📦',
    morphShape: 'rounded',
  },
  mascot: {
    emoji: '📦',
    state: 'idle',
    label: 'Courier Box',
  },
  overlay: {
    type: 'none',
  },
  badge: {
    text: 'Enterprise Partner',
    color: '#00B4D8',
  },
  banner: {
    title: 'Ram Bhaji Logistics',
    image: '',
  }
};

export const BRANDING_THEMES = {
  default: DEFAULT_THEME,

  diwali: {
    id: 'diwali',
    name: 'Diwali Festival of Lights',
    colors: {
      primary: '#D97706',       // Deep Gold / Amber
      secondary: '#F59E0B',     // Golden Yellow
      gradient: ['#D97706', '#F59E0B', '#FF7E36'],
      background: '#FFFBEB',    // Amber light background
      surface: '#FFFFFF',
      text: '#451A03',          // Deep amber brown text
      headerBg: '#FFFDF5',
      accent: '#FF7E36',
    },
    logo: {
      text: 'Shubh Diwali',
      emoji: '🪔',
      morphShape: 'rounded',
    },
    mascot: {
      emoji: '🪔',
      state: 'celebrate',
      label: 'Sparky Diya',
    },
    overlay: {
      type: 'fireworks',
    },
    badge: {
      text: 'Happy Diwali! ✨',
      color: '#D97706',
    },
    banner: {
      title: 'Festival Sweet Deals!',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500',
    }
  },

  christmas: {
    id: 'christmas',
    name: 'Christmas Winter Holidays',
    colors: {
      primary: '#DC2626',       // Crimson Red
      secondary: '#16A34A',     // Pine Green
      gradient: ['#DC2626', '#16A34A', '#15803D'],
      background: '#F0FDF4',    // Soft Pine Light Background
      surface: '#FFFFFF',
      text: '#14532D',          // Very Dark Green Text
      headerBg: '#F9FAF9',
      accent: '#DC2626',
    },
    logo: {
      text: 'Merry Christmas',
      emoji: '🎄',
      morphShape: 'circle',
    },
    mascot: {
      emoji: '⛄',
      state: 'wave',
      label: 'Frosty Snowman',
    },
    overlay: {
      type: 'snow',
    },
    badge: {
      text: 'Winter Fest! ❄️',
      color: '#DC2626',
    },
    banner: {
      title: 'Christmas Feast Specials',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
    }
  },

  holi: {
    id: 'holi',
    name: 'Holi Festival of Colors',
    colors: {
      primary: '#EC4899',       // Vibrant Pink
      secondary: '#3B82F6',     // Sky Blue
      gradient: ['#EC4899', '#3B82F6', '#8B5CF6', '#10B981'],
      background: '#FDF2F8',    // Pink Tint Background
      surface: '#FFFFFF',
      text: '#5B21B6',          // Dark Purple Text
      headerBg: '#FFFDFD',
      accent: '#10B981',
    },
    logo: {
      text: 'Happy Holi',
      emoji: '🎨',
      morphShape: 'square',
    },
    mascot: {
      emoji: '🥣',
      state: 'celebrate',
      label: 'Color Bowl',
    },
    overlay: {
      type: 'color-splash',
    },
    badge: {
      text: 'Rang Barse! 🎨',
      color: '#EC4899',
    },
    banner: {
      title: 'Color Splash Organic Greens',
      image: 'https://images.unsplash.com/photo-1492496913980-50134c307287?w=500',
    }
  },

  independence: {
    id: 'independence',
    name: 'Independence Day Tri-Color',
    colors: {
      primary: '#FF9933',       // Indian Saffron
      secondary: '#138808',     // Indian Green
      gradient: ['#FF9933', '#FFFFFF', '#138808'],
      background: '#F0FDF4',    // Saffron Tinted Cream
      surface: '#FFFFFF',
      text: '#000080',          // Navy Blue Text
      headerBg: '#FFFFFF',
      accent: '#000080',
    },
    logo: {
      text: 'Jai Hind',
      emoji: '🇮🇳',
      morphShape: 'rounded',
    },
    mascot: {
      emoji: '🇮🇳',
      state: 'deliver',
      label: 'Saluting Mascot',
    },
    overlay: {
      type: 'flags',
    },
    badge: {
      text: 'August 15 Special 🇮🇳',
      color: '#FF9933',
    },
    banner: {
      title: 'Proudly Sourced Indian Veggies',
      image: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=500',
    }
  },

  valentine: {
    id: 'valentine',
    name: 'Valentine\'s Day Love',
    colors: {
      primary: '#EC4899',       // Rose Pink
      secondary: '#E11D48',     // Crimson Rose
      gradient: ['#EC4899', '#E11D48'],
      background: '#FFF1F2',    // Rose Tint Background
      surface: '#FFFFFF',
      text: '#881337',          // Rose Maroon Text
      headerBg: '#FFF5F5',
      accent: '#E11D48',
    },
    logo: {
      text: 'GharTak Love',
      emoji: '❤️',
      morphShape: 'circle',
    },
    mascot: {
      emoji: '🥰',
      state: 'wave',
      label: 'Lovely Hearty',
    },
    overlay: {
      type: 'hearts',
    },
    badge: {
      text: 'Fresh with Love! ❤️',
      color: '#E11D48',
    },
    banner: {
      title: 'Sweet Fruits & Berries',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500',
    }
  },

  ipl: {
    id: 'ipl',
    name: 'Cricket Festival Season',
    colors: {
      primary: '#1D4ED8',       // Cricket Royal Blue
      secondary: '#F59E0B',     // Stadium Gold Accent
      gradient: ['#1D4ED8', '#F59E0B'],
      background: '#EFF6FF',    // Soft Stadium Blue Background
      surface: '#FFFFFF',
      text: '#1E3A8A',          // Royal Dark Blue Text
      headerBg: '#F8FAFC',
      accent: '#F59E0B',
    },
    logo: {
      text: 'Ram Bhaji League',
      emoji: '🏏',
      morphShape: 'rounded',
    },
    mascot: {
      emoji: '🏏',
      state: 'deliver',
      label: 'Cricketer Ramji',
    },
    overlay: {
      type: 'stars',
    },
    badge: {
      text: 'Match Day Organic snacks 🏏',
      color: '#1D4ED8',
    },
    banner: {
      title: 'Powerplay Veggie Deals!',
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
    }
  },

  halloween: {
    id: 'halloween',
    name: 'Halloween Spooktacular',
    colors: {
      primary: '#EA580C',       // Spooky Pumpkin Orange
      secondary: '#5B21B6',     // Witch Purple
      gradient: ['#EA580C', '#5B21B6'],
      background: '#FAF5FF',    // Spooky light purple
      surface: '#FFFFFF',
      text: '#311042',          // Deep purple text
      headerBg: '#FAF5FF',
      accent: '#EA580C',
    },
    logo: {
      text: 'Trick or Treat',
      emoji: '🎃',
      morphShape: 'square',
    },
    mascot: {
      emoji: '👻',
      state: 'idle',
      label: 'Spooky Ghosty',
    },
    overlay: {
      type: 'ghosts',
    },
    badge: {
      text: 'Spooktacular Fresh! 🎃',
      color: '#EA580C',
    },
    banner: {
      title: 'No Tricks, Only Organic Treats',
      image: 'https://images.unsplash.com/photo-1508349682668-ef11aae7d172?w=500',
    }
  }
};
