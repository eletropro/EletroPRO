import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { Budget, Transaction, UserProfile, OperationType } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { LogOut, Plus, Zap, LayoutDashboard, FileText, Wallet, User as UserIcon } from 'lucide-react';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setUser(newProfile);
        } else {
          setUser(userDoc.data() as UserProfile);
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
    const tQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));

    const unsubBudgets = onSnapshot(bQuery, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'budgets'));

    const unsubTransactions = onSnapshot(tQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const unsubClients = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid), orderBy('name')), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) setUser(doc.data() as UserProfile);
    });

    return () => {
      unsubBudgets();
      unsubTransactions();
      unsubClients();
      unsubProfile();
    };
  }, [user]);

  const handleFirestoreError = (error: any, op: OperationType, path: string) => {
    console.error(`Firestore Error [${op}] at ${path}:`, error);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Zap className="h-12 w-12 text-yellow-500 animate-pulse" />
          <p className="text-slate-600 font-medium">Carregando EletroPRO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-yellow-500 p-3 rounded-2xl w-fit">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">EletroPRO</CardTitle>
              <CardDescription className="text-lg">
                Gestão Profissional para Eletricistas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Crie orçamentos, emita recibos e controle suas finanças em um só lugar.
            </p>
            <Button onClick={handleLogin} className="w-full h-12 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-white">
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl tracking-tight leading-none">EletroPRO</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Brasília • DF</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-700">{user.displayName || user.email}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Profissional Verificado</span>
            </div>
            <Button variant="outline" size="icon" className="rounded-full border-slate-200 hover:bg-slate-50" onClick={() => signOut(auth)}>
              <LogOut className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <TabsList className="bg-slate-200/50 p-1 rounded-2xl w-full lg:w-auto self-start">
              <TabsTrigger value="dashboard" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="budgets" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Orçamentos
              </TabsTrigger>
              <TabsTrigger value="clients" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserIcon className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="finance" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Wallet className="h-4 w-4 mr-2" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserIcon className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
            </TabsList>

            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="btn-primary h-12 px-8 rounded-xl font-bold" onClick={() => setEditingBudget(undefined)}>
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
        <Button variant="ghost" className="flex flex-col h-auto gap-1" onClick={() => document.querySelector('[value="dashboard"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">Painel</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1" onClick={() => document.querySelector('[value="budgets"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
          <FileText className="h-5 w-5" />
          <span className="text-[10px]">Orçamentos</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1" onClick={() => document.querySelector('[value="finance"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
          <Wallet className="h-5 w-5" />
          <span className="text-[10px]">Financeiro</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1" onClick={() => document.querySelector('[value="profile"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </div>
    </div>
  );
}
