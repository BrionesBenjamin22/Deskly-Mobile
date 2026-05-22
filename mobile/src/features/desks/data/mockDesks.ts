import { Desk } from '../types/desk.types';

export const mockDesks: Desk[] = [
  {
    id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
    code: 'A2',
    name: 'Escritorio A2',
    descriptionId: '2b99ba56-65f5-4e9b-8c50-bc5930b05a14',
    description: {
      id: '2b99ba56-65f5-4e9b-8c50-bc5930b05a14',
      name: 'Individual ventana',
      description: 'Ventana',
      peopleCapacity: 1,
    },
    zone: 'A',
    enabled: true,
    status: 'available',
    amenities: [
      { id: 'am-1', name: 'Monitor Dual' },
      { id: 'am-2', name: 'Teclado' },
      { id: 'am-3', name: 'Mouse' },
      { id: 'am-4', name: 'Silla ergonomica' },
    ],
  },
  {
    id: '2ccf8de8-1ddd-46bc-a554-16d45f5fd93a',
    code: 'B1',
    name: 'Escritorio B1',
    descriptionId: '8e9bf752-1f19-46b8-bd9a-e67b61314e2a',
    description: {
      id: '8e9bf752-1f19-46b8-bd9a-e67b61314e2a',
      name: 'Colaborativo central',
      description: 'Central',
      peopleCapacity: 2,
    },
    zone: 'B',
    enabled: true,
    status: 'available',
    amenities: [
      { id: 'am-5', name: 'Monitor' },
      { id: 'am-6', name: 'Teclado' },
      { id: 'am-7', name: 'Mouse' },
    ],
  },
];
