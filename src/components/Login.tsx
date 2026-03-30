import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { signInWithGoogle } from '../firebase';

interface LoginProps {
}

export function Login({ }: LoginProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(
          `Google Sign-In Error: Unauthorized Domain (${domain}). 
          To fix this, please go to your Firebase Console: 
          https://console.firebase.google.com/project/teamzspacebackup/authentication/settings 
          and add "${domain}" to the "Authorized domains" list.`
        );
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-zinc-200">
        <CardHeader className="space-y-1 text-left">
          <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">System Login</CardTitle>
          <p className="text-sm text-zinc-500">Enter your credentials to access the POS</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="button" 
              className="w-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Mail className="h-5 w-5 mr-3 text-white" />
              Sign in with Google
            </Button>
            
            <p className="text-xs text-center text-zinc-500 mt-4">
              Sign in with your Google account to enable cloud backup and sync across devices.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-left text-zinc-400">
            Secure Access • Team Z Space POS System
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
