import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UserCircle, Building2, Phone, MapPin, Save, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface UserProfileFormProps {
  profile: UserProfile;
}

export default function UserProfileForm({ profile }: UserProfileFormProps) {
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [businessPhone, setBusinessPhone] = useState(profile.businessPhone || '');
  const [businessAddress, setBusinessAddress] = useState(profile.businessAddress || '');
  const [displayName, setDisplayName] = useState(profile.displayName || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        ...profile,
        businessName,
        businessPhone,
        businessAddress,
        displayName
      });
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="border-border bg-accent/10 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <UserCircle size={32} />
            </div>
            <div>
              <CardTitle className="text-3xl font-heading font-bold tracking-tight">Configurações do Perfil</CardTitle>
              <p className="text-muted-foreground">Personalize as informações que aparecerão em seus orçamentos.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <UserCircle size={14} className="text-primary" />
                  Seu Nome Profissional
                </Label>
                <Input 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary text-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <Building2 size={14} className="text-primary" />
                  Nome da Empresa / Fantasia
                </Label>
                <Input 
                  value={businessName} 
                  onChange={e => setBusinessName(e.target.value)} 
                  placeholder="Ex: EletroPRO Elétrica" 
                  className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary text-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <Phone size={14} className="text-primary" />
                  Telefone de Contato
                </Label>
                <Input 
                  value={businessPhone} 
                  onChange={e => setBusinessPhone(e.target.value)} 
                  className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary text-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  Endereço Comercial
                </Label>
                <Input 
                  value={businessAddress} 
                  onChange={e => setBusinessAddress(e.target.value)} 
                  className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary text-lg"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Zap size={20} className="text-primary animate-pulse-subtle" />
                <p className="text-sm">Suas alterações são salvas instantaneamente na nuvem.</p>
              </div>
              <Button type="submit" className="w-full sm:w-auto h-16 px-10 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                <Save size={24} className="mr-2" /> Salvar Perfil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
