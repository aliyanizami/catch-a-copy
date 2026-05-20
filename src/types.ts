export type OrderStatus = 'Pending Approval' | 'Accepted' | 'Rejected' | 'Printing' | 'Ready' | 'Collected' | 'Waiting for Payment';

export interface PrintOptions {
  color: 'B&W' | 'Color';
  copies: number;
  sides: 'Single' | 'Double';
  services: string[]; // binding, lamination, spiral
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  customerName: string;
  fileName: string;
  fileUrl?: string;
  fileSize: string;
  pageCount: number;
  options: PrintOptions;
  pickupTime: string;
  status: OrderStatus;
  rejectionReason?: string;
  totalAmount: number;
  createdAt: any; // Using any to support both string (mocks) and Firestore Timestamp
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  image: string;
  services?: Record<string, number> | string[];
  coordinates?: { lat: number; lng: number };
  razorpayAccountId?: string;
}

export const ADDITIONAL_SERVICES = [
  { id: 'spiral', name: 'Spiral Binding', price: 25 },
  { id: 'lamination', name: 'Lamination', price: 15 },
  { id: 'soft-binding', name: 'Soft Binding', price: 50 },
  { id: 'project-binding', name: 'Project Binding', price: 100 },
];

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  createdAt: any;
}
