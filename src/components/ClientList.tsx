import React, { useState } from 'react';
import { Client } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit, Trash2, UserPlus, Search, Phone, Mail, MapPin, User, X, Save, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientListProps {
  clients: Client[];
}

export default function ClientList({ clients }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const clientData = {
      userId: auth.currentUser.uid,
      name,
      phone,
      address,
      email,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), clientData);
      } else {
        await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const resetForm = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setAddress('');
    setEmail('');
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setEmail(client.email || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      await deleteDoc(doc(db, 'clients', id));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente por nome ou telefone..." 
            className="pl-12 h-14 rounded-2xl bg-accent/20 border-border/50 focus:ring-primary text-lg"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger render={
            <Button className="h-14 px-8 rounded-2xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
              <UserPlus className="mr-2 h-6 w-6" /> Novo Cliente
            </Button>
          } />
          <DialogContent className="rounded-[2.5rem] border-border bg-background shadow-2xl sm:max-w-lg p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-heading font-bold">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Nome Completo</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required className="h-14 rounded-2xl bg-accent/20 border-border/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Telefone / WhatsApp</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-14 rounded-2xl bg-accent/20 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">E-mail</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-accent/20 border-border/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Endereço</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} className="h-14 rounded-2xl bg-accent/20 border-border/50" />
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl font-bold text-xl shadow-xl shadow-primary/20">
                <Save size={24} className="mr-2" />
                {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="glass bg-accent/20 hover:bg-accent/40 transition-all duration-300 rounded-[2rem] p-8 border-border/50 hover:border-primary/30 relative overflow-hidden h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                    <User size={28} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-bold tracking-tight">{client.name}</h3>
                  
                  <div className="space-y-3">
                    {client.phone && (
                      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="p-2 bg-accent/30 rounded-lg"><Phone size={14} /></div>
                        <span className="text-sm font-medium">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="p-2 bg-accent/30 rounded-lg"><Mail size={14} /></div>
                        <span className="text-sm font-medium truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="p-2 bg-accent/30 rounded-lg"><MapPin size={14} /></div>
                        <span className="text-sm font-medium line-clamp-1">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cliente Ativo</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 bg-accent/30 rounded-full text-muted-foreground">
            <Users size={48} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">Tente buscar por outro nome ou cadastre um novo cliente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
