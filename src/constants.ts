import { Shop } from './types';

export const REJECTION_REASONS = [
  'Printer Maintenance',
  'Out of Spiral Coils',
  'Out of Lamination Sheets',
  'Shop Closing Early',
  'File Format Not Supported',
];

export const SHOPS: Shop[] = [
  {
    id: '1',
    name: 'QuickPrint Xerox',
    address: '123 University Ave, Near Library',
    rating: 4.8,
    distance: '0.5 km',
    image: 'https://picsum.photos/seed/xerox/800/600',
    services: ['B&W Printing', 'Color', 'Spiral Binding', 'Lamination'],
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  {
    id: '2',
    name: 'Student Copy Center',
    address: '45 College Road, Opposite Gate 2',
    rating: 4.5,
    distance: '1.2 km',
    image: 'https://picsum.photos/seed/student/800/600',
    services: ['B&W Printing', 'Lamination', 'Soft Binding', 'Project Binding'],
    coordinates: { lat: 19.0820, lng: 72.8888 }
  },
  {
    id: '3',
    name: 'Elite Digital Prints',
    address: '88 Tech Park, Ground Floor',
    rating: 4.9,
    distance: '2.5 km',
    image: 'https://picsum.photos/seed/elite/800/600',
    services: ['B&W Printing', 'Color', 'Spiral Binding', 'Lamination', 'Project Binding'],
    coordinates: { lat: 19.0650, lng: 72.8666 }
  },
];
