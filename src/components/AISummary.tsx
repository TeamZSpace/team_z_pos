import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Sale } from '../types';
import { getSalesSummary } from '../services/geminiService';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface AISummaryProps {
  sales: Sale[];
}

export function AISummary({ sales }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (sales.length === 0) return;
    setIsLoading(true);
    try {
      const result = await getSalesSummary(sales);
      setSummary(result);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-indigo-900">AI Sales Assistant (မြန်မာဘာသာ)</CardTitle>
        </div>
        <Button 
          onClick={handleGenerateSummary} 
          disabled={isLoading || sales.length === 0}
          variant="outline"
          className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {summary ? 'Update Analysis' : 'Analyze Sales'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-indigo-600 font-medium animate-pulse">AI က အရောင်းစာရင်းတွေကို တွက်ချက်နေပါတယ်...</p>
          </div>
        ) : summary ? (
          <div className="prose prose-indigo max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-8 text-indigo-400">
            <p className="text-sm">အရောင်းစာရင်းတွေကို AI နဲ့ အနှစ်ချုပ်ကြည့်ဖို့ "Analyze Sales" ကို နှိပ်ပါ။</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
