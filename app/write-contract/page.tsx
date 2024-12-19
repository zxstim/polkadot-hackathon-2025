"use client";
import WriteContract from "@/components/write-contract";
import SigpassKit from "@/components/sigpasskit";
import Link from "next/link";

export default function SendTransactionPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
      <SigpassKit />
      <div className="flex flex-col md:flex-row gap-2">
        <Link className="text-sm underline underline-offset-4" href="/">Home</Link>
        <Link className="text-sm underline underline-offset-4" href="/wallet">Wallet</Link>
        <Link className="text-sm underline underline-offset-4" href="/send-transaction">Send transaction</Link>
        <Link className="text-sm underline underline-offset-4" href="/write-contract">Write contract</Link>
      </div>
      <h1 className="text-2xl font-bold">Write Contract</h1>
      <WriteContract />
    </div>
  );
}
