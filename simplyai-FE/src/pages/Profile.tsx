import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Profile = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4 bg-gradient-to-b from-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Profilo Utente</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input type="text" placeholder="Mario Rossi" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" placeholder="mario.rossi@email.com" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Città</label>
                <Input type="text" placeholder="Roma" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Codice Fiscale</label>
                <Input type="text" placeholder="RSSMRA80A01H501U" disabled />
              </div>
              <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] mt-4" disabled>Salva modifiche</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
