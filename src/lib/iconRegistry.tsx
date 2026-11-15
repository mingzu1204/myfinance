import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  UtensilsCrossed,
  Pizza,
  Sandwich,
  Soup,
  ChefHat,
  IceCream,
  Coffee,
  CupSoda,
  Beer,
  Wine,
  GlassWater,
  Clapperboard,
  Gamepad2,
  Music,
  Ticket,
  Camera,
  Tv,
  ShoppingBag,
  ShoppingCart,
  Store,
  Shirt,
  Package,
  Bike,
  Truck,
  Car,
  Laptop,
  Building2,
  Briefcase,
  Headphones,
  Dumbbell,
  Sparkles,
  Smile,
  Clock,
} from 'lucide-react'
import { parsePresetMeta } from './metadata'

export interface IconItem {
  id: string
  label: string
  icon: LucideIcon
}

export interface IconCategory {
  id: string
  label: string
  icons: IconItem[]
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'food',
    label: 'Ăn uống / Nhà hàng',
    icons: [
      { id: 'UtensilsCrossed', label: 'Ăn uống chung', icon: UtensilsCrossed },
      { id: 'Pizza', label: 'Pizza / Đồ nướng', icon: Pizza },
      { id: 'Sandwich', label: 'Bánh mì / Fast Food', icon: Sandwich },
      { id: 'Soup', label: 'Phở / Mì / Lẩu', icon: Soup },
      { id: 'ChefHat', label: 'Đầu bếp / Nấu nướng', icon: ChefHat },
      { id: 'IceCream', label: 'Tráng miệng / Kem', icon: IceCream },
    ],
  },
  {
    id: 'beverage',
    label: 'Đồ uống / Bar / Cafe',
    icons: [
      { id: 'Coffee', label: 'Cà phê / Trà sữa', icon: Coffee },
      { id: 'CupSoda', label: 'Trà chanh / Nước ngọt', icon: CupSoda },
      { id: 'Beer', label: 'Bia / Quán nhậu / Pub', icon: Beer },
      { id: 'Wine', label: 'Rượu vang / Lounge', icon: Wine },
      { id: 'GlassWater', label: 'Nước ép / Sinh tố', icon: GlassWater },
    ],
  },
  {
    id: 'entertainment',
    label: 'Giải trí / Sự kiện',
    icons: [
      { id: 'Clapperboard', label: 'Rạp chiếu phim', icon: Clapperboard },
      { id: 'Gamepad2', label: 'Gaming / Cyber Net', icon: Gamepad2 },
      { id: 'Music', label: 'Karaoke / Âm nhạc', icon: Music },
      { id: 'Ticket', label: 'Sự kiện / Vé', icon: Ticket },
      { id: 'Camera', label: 'Chụp ảnh / Studio', icon: Camera },
      { id: 'Tv', label: 'Media / Livestream', icon: Tv },
    ],
  },
  {
    id: 'retail',
    label: 'Bán lẻ / Mua sắm',
    icons: [
      { id: 'ShoppingBag', label: 'Shop thời trang', icon: ShoppingBag },
      { id: 'ShoppingCart', label: 'Siêu thị / Bách hóa', icon: ShoppingCart },
      { id: 'Store', label: 'Cửa hàng tiện lợi', icon: Store },
      { id: 'Shirt', label: 'May mặc / Quần áo', icon: Shirt },
      { id: 'Package', label: 'Kho hàng / Đóng gói', icon: Package },
    ],
  },
  {
    id: 'transport',
    label: 'Vận chuyển / Giao nhận',
    icons: [
      { id: 'Bike', label: 'Shipper xe máy', icon: Bike },
      { id: 'Truck', label: 'Giao hàng / Xe tải', icon: Truck },
      { id: 'Car', label: 'Tài xế / Xe công nghệ', icon: Car },
    ],
  },
  {
    id: 'office',
    label: 'Văn phòng / Công nghệ',
    icons: [
      { id: 'Laptop', label: 'Lập trình / Vi tính', icon: Laptop },
      { id: 'Building2', label: 'Văn phòng / Tập đoàn', icon: Building2 },
      { id: 'Briefcase', label: 'Công sở / Kinh doanh', icon: Briefcase },
      { id: 'Headphones', label: 'CSKH / Telesale', icon: Headphones },
    ],
  },
  {
    id: 'other',
    label: 'Thể thao / Khác',
    icons: [
      { id: 'Dumbbell', label: 'Gym / Thể thao', icon: Dumbbell },
      { id: 'Sparkles', label: 'Spa / Làm đẹp', icon: Sparkles },
      { id: 'Smile', label: 'Dịch vụ / CSKH', icon: Smile },
      { id: 'Clock', label: 'Làm theo ca / Part-time', icon: Clock },
    ],
  },
]

// Map icon ID to component
export const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Pizza,
  Sandwich,
  Soup,
  ChefHat,
  IceCream,
  Coffee,
  CupSoda,
  Beer,
  Wine,
  GlassWater,
  Clapperboard,
  Gamepad2,
  Music,
  Ticket,
  Camera,
  Tv,
  ShoppingBag,
  ShoppingCart,
  Store,
  Shirt,
  Package,
  Bike,
  Truck,
  Car,
  Laptop,
  Building2,
  Briefcase,
  Headphones,
  Dumbbell,
  Sparkles,
  Smile,
  Clock,
}

export function getIconComponent(iconId?: string | null): LucideIcon {
  if (!iconId) return Briefcase
  return ICON_MAP[iconId] || Briefcase
}

export interface BrandIconProps {
  iconId?: string | null
  description?: string | null
  className?: string
  size?: number
  style?: React.CSSProperties
}

export function BrandIcon({ iconId, description, className = 'w-5 h-5', size, style }: BrandIconProps) {
  let resolvedId = iconId
  if (!resolvedId && description) {
    const meta = parsePresetMeta(description)
    resolvedId = meta.icon
  }
  const IconComp = getIconComponent(resolvedId)
  return <IconComp className={className} size={size} style={style} />
}
