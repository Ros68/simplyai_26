
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // Redirect to admin settings page
    navigate('/admin/settings');
  }, [navigate]);

  return <div>Reindirizzamento alle impostazioni...</div>;
};

export default SettingsPage;
