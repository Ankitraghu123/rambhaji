export const quickActions = [
  { key: 'plans', label: 'Plans', icon: 'text-box-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet' },
  { key: 'retail', label: 'Veggies', icon: 'cart' },
  { key: 'water', label: 'Alkaline Water', icon: 'water' },
  { key: 'support', label: 'Support', icon: 'headset' }
];

export const heroCards = [
  {
    title: 'Naturally Good Farm Tour',
    subtitle: 'Fresh harvest, trusted delivery, and easy subscription management.',
    accent: '#1F8E4C'
  },
  {
    title: 'Healthy veggies every week',
    subtitle: 'Customize bag contents, serving dates, and wallet payments.',
    accent: '#66A63C'
  }
];

export const subscriptionPlans = [
  {
    id: 'trial',
    name: 'Organic Veggie Bag (10 KG)',
    frequency: 'Trial',
    price: 2500,
    oldPrice: 2800,
    discount: '10% OFF',
    badge: 'Starter',
    recommended: false,
    description: 'A low-commitment plan for first-time customers to try fresh organic delivery.',
    deliveries: 1,
    frequencyText: 'One-time trial',
    items: ['Potato', 'Onion', 'Tomato', 'Cucumber', 'Coriander'],
    imageLabel: '🥬'
  },
  {
    id: 'monthly',
    name: 'Organic Veggie Bag (10 KG)',
    frequency: 'Monthly',
    price: 8000,
    oldPrice: 8000,
    discount: '0% OFF',
    badge: 'Popular',
    recommended: false,
    description: 'A monthly plan with regular weekly deliveries and flexible veggie choices.',
    deliveries: 4,
    frequencyText: 'Every 7 days',
    items: ['Potato', 'Onion', 'Tomato', 'Garlic', 'Ginger'],
    imageLabel: '🛍️'
  },
  {
    id: 'quarterly',
    name: 'Organic Veggie Bag (10 KG)',
    frequency: 'Quarterly',
    price: 21000,
    oldPrice: 24000,
    discount: '12% OFF',
    badge: 'Best Value',
    recommended: true,
    description: 'Best balance of savings and convenience for families who want predictable delivery.',
    deliveries: 12,
    frequencyText: '3 months',
    items: ['Potato', 'Onion', 'Tomato', 'Cucumber', 'Lemon'],
    imageLabel: '🍀'
  },
  {
    id: 'semiannual',
    name: 'Organic Veggie Bag (10 KG)',
    frequency: 'Semi Annual',
    price: 36000,
    oldPrice: 48000,
    discount: '25% OFF',
    badge: 'Family',
    recommended: true,
    description: 'Longer commitment with stronger savings for homes with regular vegetable usage.',
    deliveries: 24,
    frequencyText: '6 months',
    items: ['Potato', 'Onion', 'Garlic', 'Coriander', 'Seasonal'],
    imageLabel: '🌿'
  },
  {
    id: 'annual',
    name: 'Organic Veggie Bag (10 KG)',
    frequency: 'Annual',
    price: 60000,
    oldPrice: 96000,
    discount: '38% OFF',
    badge: 'Max Save',
    recommended: false,
    description: 'Annual plan for maximum savings and hassle-free year-round deliveries.',
    deliveries: 52,
    frequencyText: '12 months',
    items: ['Potato', 'Onion', 'Tomato', 'Seasonal', 'Special Add-ons'],
    imageLabel: '🏆'
  },
  {
    id: 'miracle',
    name: 'Miracle Plan',
    frequency: 'Water',
    price: 1200,
    oldPrice: 1800,
    discount: 'Save 33%',
    badge: 'Alkaline',
    recommended: true,
    category: 'water',
    description: 'Alkaline water between 8.5 to 9.5 pH with negative ORP. Best used within 12 to 18 hours of delivery. Produced by a Japanese ionisation machine through electrolysis of 130 TDS water only. No chemicals used.',
    deliveries: 1,
    frequencyText: 'Fresh alkaline water delivery',
    items: ['8.5 to 9.5 pH', 'Negative ORP', '130 TDS source water', 'No chemicals', 'Best within 12 to 18 hours'],
    imageLabel: '9.5 pH'
  }
];

export const basketPlans = [
  {
    id: 'nano',
    name: 'NANO',
    totalWeight: '2,550 gms',
    color: '#1879B7',
    items: [
      ['Potato', '500gms'], ['Onion', '500gms'], ['Tomato', '250gms'], ['Cucumber', '200gms'],
      ['Lemon', '100gms'], ['Garlic', '100gms'], ['Ginger', '50gms'], ['Coriander', '50gms'],
      ['Green Chillies', '50gms'], ['Seasonal 1', '250gms'], ['Seasonal 2', '250gms'], ['Seasonal 3', '250gms']
    ]
  },
  {
    id: 'silver',
    name: 'SILVER',
    totalWeight: '4,590 gms',
    color: '#F3A56D',
    items: [
      ['Potato', '900gms'], ['Onion', '900gms'], ['Tomato', '450gms'], ['Cucumber', '360gms'],
      ['Lemon', '180gms'], ['Garlic', '180gms'], ['Ginger', '90gms'], ['Coriander', '90gms'],
      ['Green Chillies', '90gms'], ['Seasonal 1', '450gms'], ['Seasonal 2', '450gms'], ['Seasonal 3', '450gms']
    ]
  },
  {
    id: 'gold',
    name: 'GOLD',
    totalWeight: '6,930 gms',
    color: '#F04D3F',
    items: [
      ['Potato', '1,300gms'], ['Onion', '1,300gms'], ['Tomato', '650gms'], ['Cucumber', '520gms'],
      ['Lemon', '260gms'], ['Garlic', '260gms'], ['Ginger', '130gms'], ['Coriander', '130gms'],
      ['Green Chillies', '130gms'], ['Seasonal 1', '750gms'], ['Seasonal 2', '750gms'], ['Seasonal 3', '750gms']
    ]
  }
];

export const freshVeggies = [
  { id: 'potato', label: 'Potatoes', icon: '🥔', color: '#F0D98A', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=420&q=80' },
  { id: 'onion', label: 'Onions (Red)', icon: '🧅', color: '#E3B0AD', image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=420&q=80' },
  { id: 'tomato', label: 'Tomatoes (Desi)', icon: '🍅', color: '#F7A28F', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=420&q=80' },
  { id: 'garlic', label: 'Garlic', icon: '🧄', color: '#EADDC8', image: 'https://images.unsplash.com/photo-1615477550927-6ec9bbabcac4?auto=format&fit=crop&w=420&q=80' },
  { id: 'ginger', label: 'Ginger', icon: '🫚', color: '#E7D1A0', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=420&q=80' },
  { id: 'coriander', label: 'Coriander', icon: '🌿', color: '#BFE1B8', image: 'https://images.unsplash.com/photo-1600326145359-3a44909d1a39?auto=format&fit=crop&w=420&q=80' }
];

export const waterProducts = [
  {
    id: 'miracle-plan',
    name: 'Miracle Plan',
    price: 1200,
    oldPrice: 1800,
    unit: '8.5 to 9.5 pH alkaline water',
    icon: '9.5',
    badge: 'Premium',
    popular: true,
    description: 'Negative ORP alkaline water, made by Japanese ionisation electrolysis of 130 TDS water. Best used within 12 to 18 hours. No chemicals used.'
  },
  { id: 'alkaline-1', name: 'Alkaline Water 20L', price: 120, unit: 'Per bottle', icon: '💧', badge: 'Subscription' },
  { id: 'alkaline-2', name: 'Alkaline Water 1L', price: 30, unit: 'Pack of 12', icon: '🫧', badge: 'Retail' },
  { id: 'alkaline-3', name: 'Mineral Boost Water', price: 180, unit: 'Combo pack', icon: '✨', badge: 'Premium' }
];

export const retailProducts = [
  { id: 'r1', name: 'Potato', price: 35, unit: '1 KG', icon: '🥔', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=420&q=80' },
  { id: 'r2', name: 'Onion', price: 42, unit: '1 KG', icon: '🧅', image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=420&q=80' },
  { id: 'r3', name: 'Tomato', price: 55, unit: '1 KG', icon: '🍅', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=420&q=80' },
  { id: 'r4', name: 'Garlic', price: 120, unit: '500 GM', icon: '🧄', image: 'https://images.unsplash.com/photo-1615477550927-6ec9bbabcac4?auto=format&fit=crop&w=420&q=80' },
  { id: 'r5', name: 'Ginger', price: 80, unit: '500 GM', icon: '🫚', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=420&q=80' },
  { id: 'r6', name: 'Coriander', price: 20, unit: 'Bunch', icon: '🌿', image: 'https://images.unsplash.com/photo-1600326145359-3a44909d1a39?auto=format&fit=crop&w=420&q=80' }
];

export const deliveries = [
  { id: 'd1', date: 'Today', time: '08:00 AM - 11:00 AM', title: 'Weekly Veggie Bag', status: 'Arriving', area: 'Kolar Road', note: 'Driver assigned' },
  { id: 'd2', date: 'Tomorrow', time: '07:30 AM - 10:30 AM', title: 'Fresh Veggies Add-on', status: 'Upcoming', area: 'Bawadiya Kalan', note: 'Packed and ready' },
  { id: 'd3', date: '12 Jun', time: '09:00 AM - 12:00 PM', title: 'Monthly Subscription', status: 'Delivered', area: 'Arera Colony', note: 'Left at gate' },
  { id: 'd4', date: '15 Jun', time: '09:30 AM - 11:30 AM', title: 'Retail Order', status: 'Failed', area: 'MP Nagar', note: 'Customer unavailable' }
];

export const walletTransactions = [
  { id: 't1', title: 'Subscription deduction', amount: -8000, date: 'Today', type: 'debit' },
  { id: 't2', title: 'Wallet recharge', amount: 12000, date: 'Yesterday', type: 'credit' },
  { id: 't3', title: 'Retail order', amount: -240, date: '10 Jun', type: 'debit' },
  { id: 't4', title: 'Manual adjustment', amount: 500, date: '09 Jun', type: 'credit' }
];

export const notifications = [
  { id: 'n1', title: 'Subscription expiring soon', message: 'Renew now to avoid delivery interruption.', type: 'warning', unread: true },
  { id: 'n2', title: 'Wallet balance low', message: 'Please recharge for uninterrupted deduction.', type: 'danger', unread: true },
  { id: 'n3', title: 'Delivery status updated', message: 'Today’s order is out for delivery.', type: 'success', unread: false },
  { id: 'n4', title: 'Support reply received', message: 'Your complaint ticket has been updated.', type: 'info', unread: false }
];

export const supportTickets = [
  { id: 'c1', title: 'Missing coriander bundle', status: 'Open', date: 'Today', category: 'Partial delivery' },
  { id: 'c2', title: 'Wallet recharge pending', status: 'In progress', date: 'Yesterday', category: 'Payment' },
  { id: 'c3', title: 'Change delivery date', status: 'Resolved', date: '10 Jun', category: 'Schedule change' }
];

export const userProfile = {
  name: 'Pranshu',
  phone: '+91 91792 89234',
  address: 'Bhopal, Madhya Pradesh'
};

export const menuItems = [
  { label: 'Personal Information', route: 'Settings', icon: 'account-outline' },
  { label: 'My Address', route: 'Address', icon: 'map-marker-outline' },
  { label: 'My Subscriptions', route: 'MySubscriptions', icon: 'text-box-outline' },
  { label: 'My Deliveries', route: 'Deliveries', icon: 'truck-outline' },
  { label: 'Veggie Preferences', route: 'Customization', params: { isGlobalPrefs: true }, icon: 'carrot' },
  { label: 'My Orders', route: 'RetailOrders', icon: 'cart-outline' },
  { label: 'My Referral', route: 'Refer', icon: 'account-multiple-plus-outline' },
  // { label: 'My Coupons', route: 'Refer', icon: 'ticket-percent-outline' },
  // { label: 'Support Tickets', route: 'Support', icon: 'headset' },
  // { label: 'My Notifications', route: 'Notifications', icon: 'bell-outline' },
  // { label: 'FAQs', route: 'Faq', icon: 'help-circle-outline' }
];

export const pickupRules = [
  'Minimum gap: 15 days',
  'Standard gap: 15–30 days',
  'Maximum gap: 45 days'
];

export const fixedVeggies = [
  'Potato',
  'Onion',
  'Tomato',
  'Cucumber',
  'Lemon',
  'Garlic',
  'Ginger',
  'Coriander',
  'Green Chillies'
];

export const addressBook = [
  { id: 'a1', label: 'Home', value: 'Bhopal, Madhya Pradesh' },
  { id: 'a2', label: 'Office', value: 'MP Nagar, Bhopal' },
  { id: 'a3', label: 'Farm House', value: 'Kolar Road, Bhopal' }
];
