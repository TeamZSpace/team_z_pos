import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { signInWithGoogle } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

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
        const projectId = firebaseConfig.projectId;
        setError(
          `Google Sign-In Error: Unauthorized Domain (${domain}). 
          To fix this, please go to your Firebase Console: 
          https://console.firebase.google.com/project/${projectId}/authentication/settings 
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md shadow-2xl border-white/20 bg-white/70 backdrop-blur-xl relative z-10 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-10">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20 rotate-3">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900">Welcome Back</CardTitle>
          <p className="text-zinc-500 font-medium">Securely access your business dashboard</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50/50 backdrop-blur-sm p-4 rounded-2xl border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <Button 
                type="button" 
                className="relative w-full h-14 text-lg font-semibold rounded-2xl transition-all duration-300 active:scale-[0.98]"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-3" />
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-zinc-200"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Security Verified</span>
              <div className="h-px flex-1 bg-zinc-200"></div>
            </div>

            <p className="text-xs text-center text-zinc-400 leading-relaxed px-4">
              By signing in, you agree to our terms of service and privacy policy. 
              Your data is encrypted and synced securely.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 py-6 px-8 flex justify-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Team Z Space POS System
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
