import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { Budget, Transaction, UserProfile, OperationType } from './types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Plus, Zap, LayoutDashboard, FileText, Wallet, User as UserIcon, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BudgetForm from './components/BudgetForm';
import BudgetList from './components/BudgetList';
import TransactionList from './components/TransactionList';
import UserProfileForm from './components/UserProfileForm';
import ClientList from './components/ClientList';
import { Client } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const bQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribeBudgets = onSnapshot(bQuery, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
    });

    const tQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribeTransactions = onSnapshot(tQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    const cQuery = query(collection(db, 'clients'), where('userId', '==', user.uid), orderBy('name'));
    const unsubscribeClients = onSnapshot(cQuery, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeTransactions();
      unsubscribeClients();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">EletroBudget BSB</CardTitle>
            <p className="text-muted-foreground">Gestão profissional para eletricistas em Brasília</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full h-12 text-lg font-semibold rounded-xl bg-amber-600 hover:bg-amber-700">
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-1.5 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold text-gray-900 hidden sm:block">EletroBudget BSB</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full border" referrerPolicy="no-referrer" />
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-auto flex-wrap">
              <TabsTrigger value="dashboard" className="rounded-xl py-2.5 px-5">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="budgets" className="rounded-xl py-2.5 px-5">
                <FileText className="h-4 w-4 mr-2" />
                Orçamentos
              </TabsTrigger>
              <TabsTrigger value="clients" className="rounded-xl py-2.5 px-5">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="finance" className="rounded-xl py-2.5 px-5">
                <Wallet className="h-4 w-4 mr-2" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl py-2.5 px-5">
                <UserIcon className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
            </TabsList>

            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="h-12 px-8 rounded-xl font-bold" onClick={() => setEditingBudget(undefined)}>
                    <Plus className="mr-2 h-5 w-5" /> Novo Orçamento
                  </Button>
                }
              />
              <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="text-2xl font-display font-bold">
                    {editingBudget ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
                  </DialogTitle>
                </DialogHeader>
                <div className="pt-6">
                  <BudgetForm 
                    budget={editingBudget} 
                    clients={clients}
                    onSuccess={() => {
                      setIsBudgetDialogOpen(false);
                      setEditingBudget(undefined);
                    }} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-8 transition-all duration-300">
            <TabsContent value="dashboard" className="focus-visible:outline-none">
              <Dashboard budgets={budgets} transactions={transactions} />
            </TabsContent>

            <TabsContent value="budgets" className="focus-visible:outline-none">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b px-8 py-6">
                  <CardTitle className="text-2xl font-display font-bold">Seus Orçamentos</CardTitle>
                  <CardDescription>Gerencie seus orçamentos e gere documentos profissionais para seus clientes.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <BudgetList 
                    budgets={budgets} 
                    userProfile={user} 
                    onEdit={(b) => {
                      setEditingBudget(b);
                      setIsBudgetDialogOpen(true);
                    }} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="focus-visible:outline-none">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b px-8 py-6">
                  <CardTitle className="text-2xl font-display font-bold">Gestão de Clientes</CardTitle>
                  <CardDescription>Cadastre e gerencie os contatos dos seus clientes.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <ClientList clients={clients} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance" className="focus-visible:outline-none">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b px-8 py-6">
                  <CardTitle className="text-2xl font-display font-bold">Controle Financeiro</CardTitle>
                  <CardDescription>Acompanhe suas receitas e despesas de forma organizada.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <TransactionList transactions={transactions} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="focus-visible:outline-none">
              <UserProfileForm profile={user} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-20">
        <Button variant="ghost" className={cn("flex flex-col h-auto gap-1", activeTab === 'dashboard' && "text-amber-600")} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">Painel</span>
        </Button>
        <Button variant="ghost" className={cn("flex flex-col h-auto gap-1", activeTab === 'budgets' && "text-amber-600")} onClick={() => setActiveTab('budgets')}>
          <FileText className="h-5 w-5" />
          <span className="text-[10px]">Orçamentos</span>
        </Button>
        <Button variant="ghost" className={cn("flex flex-col h-auto gap-1", activeTab === 'finance' && "text-amber-600")} onClick={() => setActiveTab('finance')}>
          <Wallet className="h-5 w-5" />
          <span className="text-[10px]">Financeiro</span>
        </Button>
        <Button variant="ghost" className={cn("flex flex-col h-auto gap-1", activeTab === 'profile' && "text-amber-600")} onClick={() => setActiveTab('profile')}>
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </div>
    </div>
  );
}
