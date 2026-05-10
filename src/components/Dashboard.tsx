import React, { useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export default function Dashboard({ budgets, transactions }: DashboardProps) {
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const pendingBudgets = budgets.filter(b => b.status === 'pending').length;
    const approvedBudgets = budgets.filter(b => b.status === 'approved').length;
    const completedBudgets = budgets.filter(b => b.status === 'completed').length;
    
    return { totalIncome, totalExpense, balance, pendingBudgets, approvedBudgets, completedBudgets };
  }, [budgets, transactions]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTransactions = transactions.filter(t => t.date.startsWith(date));
      return {
        name: date.split('-').slice(2).join('/'),
        receita: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        despesa: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  const COLORS = ['#F97316', '#27272A'];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: 'Saldo Total', value: stats.balance, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Receitas', value: stats.totalIncome, icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Despesas', value: stats.totalExpense, icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Orc. Pendentes', value: stats.pendingBudgets, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10', isCount: true },
          { label: 'Orc. Aprovados', value: stats.approvedBudgets, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', isCount: true },
          { label: 'Orc. Pagos', value: stats.completedBudgets, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', isCount: true },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-border bg-accent/30 backdrop-blur-sm hover:bg-accent/50 transition-colors rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <Zap size={16} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-heading font-bold tracking-tight">
                    {stat.isCount ? stat.value : `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-border bg-accent/20 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Fluxo de Caixa (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="receita" fill="url(#colorReceita)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesa" fill="#27272A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border bg-accent/20 backdrop-blur-sm rounded-[2rem] h-full overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[400px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Receita', value: stats.totalIncome },
                      { name: 'Despesa', value: stats.totalExpense }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 w-full">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Receitas</span>
                  </div>
                  <span className="font-bold">R$ {stats.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-muted-foreground">Despesas</span>
                  </div>
                  <span className="font-bold">R$ {stats.totalExpense.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
