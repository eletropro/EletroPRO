import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Budget, Transaction, Client } from './types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { LayoutDashboard, Users, FileText, Wallet, UserCircle, LogOut, Zap, Plus, Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import BudgetList from './components/BudgetList';
import BudgetForm from './components/BudgetForm';
import TransactionList from './components/TransactionList';
import UserProfileForm from './components/UserProfileForm';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (!user || budgets.length === 0) return;

    const checkNotifications = () => {
      const now = new Date();
      const newNotifications: any[] = [];
      const dismissedReminders = JSON.parse(localStorage.getItem(`dismissed_reminders_${user.uid}`) || '[]');

      budgets.forEach(budget => {
        const budgetDate = new Date(budget.date);
        const diffInHours = (now.getTime() - budgetDate.getTime()) / (1000 * 60 * 60);

        // If budget is older than 24h and not yet dismissed
        if (diffInHours >= 24 && !dismissedReminders.includes(budget.id) && budget.status === 'pending') {
          newNotifications.push({
            id: `remind_${budget.id}`,
            title: 'Lembrete de Orçamento',
            message: `O orçamento para ${budget.clientName} foi criado há mais de 24h. Que tal dar um retorno?`,
            date: new Date().toISOString(),
            budgetId: budget.id,
            read: false
          });
        }
      });

      setNotifications(newNotifications);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, budgets]);

  const dismissNotification = (budgetId: string) => {
    if (!user) return;
    const dismissedReminders = JSON.parse(localStorage.getItem(`dismissed_reminders_${user.uid}`) || '[]');
    localStorage.setItem(`dismissed_reminders_${user.uid}`, JSON.stringify([...dismissedReminders, budgetId]));
    setNotifications(notifications.filter(n => n.budgetId !== budgetId));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
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
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-primary"
        >
          <Zap size={48} fill="currentColor" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-12 z-10 max-w-2xl"
        >
          <div className="relative inline-block">
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="glass-orange p-10 rounded-[3rem] shadow-2xl shadow-primary/30 relative z-20 border-primary/20"
            >
              <Zap size={72} className="text-primary mx-auto mb-6" fill="currentColor" />
              <h1 className="text-6xl font-heading font-bold tracking-tighter">
                Eletro<span className="text-primary">PRO</span>
              </h1>
            </motion.div>
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse-subtle" />
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-heading font-bold text-foreground leading-tight">
              A nova era da gestão para <span className="text-primary">Eletricistas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Simplifique seus orçamentos, domine suas finanças e encante seus clientes com profissionalismo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="h-16 px-10 text-xl rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all bg-primary hover:bg-primary/90"
            >
              Entrar com Google
            </Button>
            <p className="text-sm text-muted-foreground sm:max-w-[200px] text-center sm:text-left">
              Acesso seguro e instantâneo. Sem formulários chatos.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'transactions', label: 'Financeiro', icon: Wallet },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 border-r border-border p-8 space-y-10 sticky top-0 h-screen bg-background/80 backdrop-blur-2xl z-30">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-3 bg-primary/15 rounded-2xl text-primary border border-primary/20"
            >
              <Zap size={28} fill="currentColor" />
            </motion.div>
            <span className="text-2xl font-heading font-bold tracking-tight">
              Eletro<span className="text-primary">PRO</span>
            </span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-muted-foreground relative bg-accent/30 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />
              )}
            </button>
            
            <AnimatePresence>
              {isNotificationOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotificationOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-3 w-80 bg-background border border-border rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-5 border-b border-border bg-accent/10">
                      <h3 className="font-heading font-bold">Notificações</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                          <Bell size={32} className="mx-auto text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">Tudo limpo por aqui!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-5 border-b border-border/50 hover:bg-accent/20 transition-colors relative group">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Zap size={14} fill="currentColor" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold">{n.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                              </div>
                              <button 
                                onClick={() => dismissNotification(n.budgetId)}
                                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                activeTab === item.id 
                  ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30' 
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <item.icon size={22} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <span className="font-semibold text-base">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -left-1 w-1 h-8 bg-primary-foreground rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-border space-y-6">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="w-10 h-10 rounded-full border border-border"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
          >
            <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-semibold">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-5 border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-primary" fill="currentColor" />
          <span className="font-heading font-bold text-xl tracking-tight">EletroPRO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-muted-foreground relative bg-accent/30 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <Bell size={22} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotificationOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-background border border-border rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-5 border-b border-border bg-accent/10">
                      <h3 className="font-heading font-bold">Notificações</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                          <Bell size={32} className="mx-auto text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">Tudo limpo por aqui!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-5 border-b border-border/50 hover:bg-accent/20 transition-colors relative group">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Zap size={14} fill="currentColor" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold">{n.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                              </div>
                              <button 
                                onClick={() => dismissNotification(n.budgetId)}
                                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground bg-accent/50 rounded-xl"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-[73px] bg-background/95 backdrop-blur-2xl border-b border-border z-40 p-6 space-y-3 shadow-2xl"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20' 
                    : 'text-muted-foreground bg-accent/30'
                }`}
              >
                <item.icon size={22} />
                <span className="font-bold text-lg">{item.label}</span>
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-border">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl text-destructive bg-destructive/5"
              >
                <LogOut size={22} />
                <span className="font-bold text-lg">Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-16 max-w-7xl mx-auto w-full overflow-x-hidden">
        <div className="space-y-12">
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <motion.h1 
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-heading font-bold tracking-tight"
              >
                {navItems.find(i => i.id === activeTab)?.label}
              </motion.h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {activeTab === 'dashboard' && `Olá, ${user.displayName.split(' ')[0]}. Aqui está o resumo do seu negócio hoje.`}
                {activeTab === 'budgets' && 'Crie e gerencie orçamentos profissionais em segundos.'}
                {activeTab === 'clients' && 'Centralize as informações de todos os seus clientes.'}
                {activeTab === 'transactions' && 'Controle total sobre suas receitas e despesas.'}
                {activeTab === 'profile' && 'Personalize como seus clientes veem sua empresa.'}
              </p>
            </div>
            
            {activeTab === 'budgets' && (
              <Button 
                onClick={() => {
                  setEditingBudget(undefined);
                  setIsBudgetFormOpen(true);
                }}
                className="rounded-2xl h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all"
              >
                <Plus size={24} className="mr-2" /> Novo Orçamento
              </Button>
            )}
          </header>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="min-h-[60vh]"
          >
            {activeTab === 'dashboard' && <Dashboard budgets={budgets} transactions={transactions} />}
            {activeTab === 'budgets' && (
              isBudgetFormOpen ? (
                <BudgetForm 
                  budget={editingBudget} 
                  clients={clients}
                  onSuccess={() => {
                    setIsBudgetFormOpen(false);
                    setEditingBudget(undefined);
                  }} 
                  onClose={() => setIsBudgetFormOpen(false)}
                />
              ) : (
                <BudgetList 
                  budgets={budgets} 
                  userProfile={user} 
                  onEdit={(b) => {
                    setEditingBudget(b);
                    setIsBudgetFormOpen(true);
                  }} 
                />
              )
            )}
            {activeTab === 'clients' && <ClientList clients={clients} />}
            {activeTab === 'transactions' && <TransactionList transactions={transactions} />}
            {activeTab === 'profile' && <UserProfileForm profile={user} />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
