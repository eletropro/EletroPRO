import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      businessName,
      businessPhone,
      businessAddress,
      displayName
    });
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da sua Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Seu Nome Profissional</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Nome da Empresa / Fantasia</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ex: EletroPRO Elétrica" />
          </div>
          <div className="space-y-2">
            <Label>Telefone de Contato</Label>
            <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Salvar Perfil</Button>
        </form>
      </CardContent>
    </Card>
  );
}
