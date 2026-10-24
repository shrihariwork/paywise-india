import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayWise India — AI Payment & Rewards Optimizer SuperApp',
  description:
    'Maximize cashback, credit card rewards, RuPay UPI perks, and dining aggregator discounts with real-time mathematical optimization across Indian merchants.',
  keywords: [
    'Credit Cards India',
    'HDFC Infinia',
    'SBI Cashback Card',
    'HSBC Live+',
    'Swiggy Dineout',
    'RuPay UPI',
    'GyFTR SmartBuy',
    'DMart Cashback',
    'Reward Points Optimizer',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080b11] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
