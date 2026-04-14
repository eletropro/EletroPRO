import React, { useState } from 'react';
import { Client } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit, Trash2, UserPlus, Search } from 'lucide-react';

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
    if (window.confirm('Excluir este cliente?')) {
      await deleteDoc(doc(db, 'clients', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar cliente por nome ou telefone..." 
            className="pl-10 h-11 rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger render={
            <Button className="btn-primary h-11 px-6 rounded-xl font-bold">
              <UserPlus className="mr-2 h-5 w-5" /> Novo Cliente
            </Button>
          } />
          <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold">
                {editingClient ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Nome</TableHead>
              <TableHead className="font-bold">Contato</TableHead>
              <TableHead className="font-bold">Endereço</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{client.phone}</span>
                    <span className="text-xs text-slate-400">{client.email}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{client.address}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
