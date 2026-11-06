import { BedDouble, RefreshCw, CalendarDays, MessageSquare, ChartNoAxesCombined, Sparkles, House, CreditCard, Users, PanelsTopLeft, Megaphone } from 'lucide-react';

const icons = {
  'pms': BedDouble,
  'channel-managers': RefreshCw,
  'booking-engines': CalendarDays,
  'guest-messaging': MessageSquare,
  'revenue-management': ChartNoAxesCombined,
  'housekeeping': Sparkles,
  'direct-booking': House,
  'payments': CreditCard,
  'crm': Users,
  'website-builders': PanelsTopLeft,
  'marketing': Megaphone,
} as const;

export function CategoryIcon({id}:{id:keyof typeof icons}) {
  const Icon = icons[id];
  return <span className="category-icon" aria-hidden="true"><Icon size="1em" strokeWidth={1.6}/></span>;
}
