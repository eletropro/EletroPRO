export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  notes?: string;
}

export interface BudgetItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  marketPrice?: number;
  total: number;
}

export interface Budget {
  id: string;
  userId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  date: string;
  items: BudgetItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  budgetId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
