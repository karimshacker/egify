import { Request } from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  stores?: UserStore[];
  roles?: Role[];
}

export interface UserStore {
  id: string;
  userId: string;
  storeId: string;
  role: 'owner' | 'admin' | 'staff';
  permissions: string[];
  createdAt: Date;
  store?: Store;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Store types
export interface Store {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  subdomain: string;
  logo?: string;
  favicon?: string;
  currency: string;
  timezone: string;
  language: string;
  isActive: boolean;
  isPublished: boolean;
  settings: StoreSettings;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner?: User;
  users?: UserStore[];
  products?: Product[];
  orders?: Order[];
  customers?: Customer[];
}

export interface StoreSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  checkout: {
    requireShipping: boolean;
    requireBilling: boolean;
    allowGuestCheckout: boolean;
    termsAndConditions: boolean;
    privacyPolicy: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderConfirmation: boolean;
    shippingUpdates: boolean;
  };
  shipping: {
    freeShippingThreshold?: number;
    defaultShippingRate: number;
    shippingZones: ShippingZone[];
  };
  payment: {
    acceptedPaymentMethods: string[];
    stripeEnabled: boolean;
    paypalEnabled: boolean;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'continue';
  isActive: boolean;
  isDigital: boolean;
  isGiftCard: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  collections: ProductCollection[];
  seo: ProductSEO;
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  store?: Store;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  weight?: number;
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'continue';
  isActive: boolean;
  options: ProductVariantOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantOption {
  id: string;
  name: string;
  value: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCollection {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  conditions: CollectionCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  items: OrderItem[];
  customer: Customer;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  notes?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  store?: Store;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  tax: number;
  discount: number;
  product?: Product;
  variant?: ProductVariant;
}

// Customer types
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  isActive: boolean;
  emailVerified: boolean;
  acceptsMarketing: boolean;
  tags: string[];
  notes?: string;
  addresses: Address[];
  orders: Order[];
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  store?: Store;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
  type: 'shipping' | 'billing' | 'both';
}

// Shipping types
export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  weightBasedRates: WeightBasedRate[];
  priceBasedRates: PriceBasedRate[];
  flatRates: FlatRate[];
}

export interface WeightBasedRate {
  id: string;
  name: string;
  minWeight: number;
  maxWeight?: number;
  rate: number;
  additionalRate?: number;
}

export interface PriceBasedRate {
  id: string;
  name: string;
  minPrice: number;
  maxPrice?: number;
  rate: number;
}

export interface FlatRate {
  id: string;
  name: string;
  rate: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  rate: number;
  estimatedDays?: number;
  isActive: boolean;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  name: string;
  description?: string;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

// Analytics types
export interface Analytics {
  storeId: string;
  date: Date;
  metrics: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    conversionRate: number;
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  salesByHour: SalesByHour[];
  salesByDay: SalesByDay[];
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface TopCategory {
  categoryId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesByHour {
  hour: number;
  sales: number;
  orders: number;
}

export interface SalesByDay {
  date: string;
  sales: number;
  orders: number;
}

// Marketing types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  subject?: string;
  content: string;
  targetAudience: TargetAudience;
  schedule?: CampaignSchedule;
  statistics: CampaignStatistics;
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  store?: Store;
}

export interface TargetAudience {
  segments: string[];
  filters: AudienceFilter[];
  estimatedReach: number;
}

export interface AudienceFilter {
  field: string;
  operator: string;
  value: any;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  time: string;
}

export interface CampaignStatistics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  conversionRate: number;
  revenue: number;
}

// Webhook types
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  store?: Store;
}

export type WebhookEvent = 
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'order.fulfilled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'inventory.updated';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Notification types
export interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  metadata?: Record<string, any>;
  sentAt?: Date;
  createdAt: Date;
}

// Audit log types
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  user?: User;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
} 