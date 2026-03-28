import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sale } from "../types";
'use client';



// Initialize the SDK using the environment variable provided by the platform
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);

export async function getSalesSummary(salesData: Sale[]) {
  // Simplify data for the prompt to avoid token limits
  const simplifiedSales = salesData.map(s => ({
    date: s.date,
    items: s.items.map(i => ({ name: i.productName, qty: i.quantity, revenue: i.totalRevenue, cost: i.totalCost })),
    totalRevenue: s.totalRevenue,
    totalCost: s.totalCost
  }));

  const prompt = `ငါ့ရဲ့ POS က ဒီနေ့ရောင်းရတဲ့ စာရင်းတွေကတော့ ${JSON.stringify(simplifiedSales)} ဖြစ်ပါတယ်။ 
                  ဒါကို ကြည့်ပြီး ဘယ်ပစ္စည်းက အမြတ်အများဆုံးလဲနဲ့ နောက်ရက်အတွက် ဘာတွေပြင်ဆင်ရမလဲ မြန်မာလို အနှစ်ချုပ်ပေးပါ။
                  အဖြေကို Markdown format နဲ့ ပေးပါ။`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "AI analysis failed. Please try again later.";
  }
}
