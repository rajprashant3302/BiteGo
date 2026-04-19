import { Gift, Zap, Percent } from 'lucide-react';

export const DEALS = [
  {
    id: 'd1',
    title: '50% OFF up to $10',
    subtitle: 'On your first 3 orders',
    code: 'WELCOME50',
    icon: Gift,
    gradient: 'from-orange-500 to-rose-500',
    expiry: 'Ends tonight',
    discount: { type: 'percent', value: 50, max: 10 },
  },
  {
    id: 'd2',
    title: 'Free Delivery',
    subtitle: 'All weekend long on any order',
    code: 'FREEDEL',
    icon: Zap,
    gradient: 'from-violet-500 to-indigo-500',
    expiry: 'Ends Sunday',
    discount: { type: 'fixed', value: 2.99 },
  },
  {
    id: 'd3',
    title: '30% OFF Healthy',
    subtitle: 'On all Green Bowl items',
    code: 'EAT30',
    icon: Percent,
    gradient: 'from-emerald-500 to-teal-500',
    expiry: 'Limited time',
    discount: { type: 'percent', value: 30 },
  },
];

export const SCHEDULE_TIMES = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM',  '2:00 PM',  '6:00 PM',
  '7:00 PM',  '8:00 PM',  '9:00 PM',
];