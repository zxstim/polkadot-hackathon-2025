"use client";
import SigpassKit from "@/components/sigpasskit";


export default function WalletPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
      <h1>Wallet</h1>
      <SigpassKit />
    </div>
  );
}