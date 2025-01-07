"use client";

import {
  type BaseError,
  useWaitForTransactionReceipt,
  useConfig,
  useWriteContract,
  useReadContracts,
  useAccount
} from "wagmi";
import {
  Ban,
  ExternalLink,
  ChevronDown,
  X,
  Hash,
  LoaderCircle,
  CircleCheck,
  WalletMinimal,
  HandCoins,
  Vault,
  RefreshCcw,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUnits, parseUnits } from "viem";
import { lstokenAbi, zekaeVaultAbi } from "@/lib/abis";
import { getSigpassWallet } from "@/lib/sigpass";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { localConfig } from "@/app/providers";
import { formatBalance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";


export default function Deposit() {
  // useConfig hook to get config
  const config = useConfig();

  // useAccount hook to get account
  const account = useAccount();

  // get the address from session storage
  const address = useAtomValue(addressAtom);

  // contract addresses
  const LST_CONTRACT_ADDRESS = "0xac329056F5d04C1125d8d3500cD2dF819eD9cA86";
  const ZEKAE_VAULT_CONTRACT_ADDRESS = "0xF2cBA4d5C9A1A0b15bFCa4Db467422dcddB628e0";


  // form schema for sending transaction
  const formSchema = z.object({
    // amount is a required field
    amount: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Amount must be a positive number",
      })
      .refine((val) => /^\d*\.?\d{0,18}$/.test(val), {
        message: "Amount cannot have more than 18 decimal places",
      })
      .superRefine((val, ctx) => {
        if (!currentLstBalance) return;

        const inputAmount = parseUnits(val, 18 as number);

        if (inputAmount > (currentLstBalance as bigint)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Amount exceeds available balance",
          });
        }
      }),
  });
  
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    // resolver is zodResolver
    resolver: zodResolver(formSchema),
    // default values for address and amount
    defaultValues: {
      amount: "",
    },
  });

  // useReadContracts hook to read contract
  const { data, refetch, isFetching } = useReadContracts({
    contracts: [
      {
        address: LST_CONTRACT_ADDRESS,
        abi: lstokenAbi,
        functionName: "balanceOf",
        args: [address ? address : account.address],
      },
      {
        address: ZEKAE_VAULT_CONTRACT_ADDRESS,
        abi: zekaeVaultAbi,
        functionName: "addressToDeposit",
        args: [
          address ? address : account.address,
        ],
      },
      {
        address: LST_CONTRACT_ADDRESS,
        abi: lstokenAbi,
        functionName: "allowance",
        args: [
          address ? address : account.address,
          ZEKAE_VAULT_CONTRACT_ADDRESS,
        ],
      },
    ],
    config: address ? localConfig : config,
  });

  // extract the data from the read contracts hook
  const currentLstBalance = data?.[0]?.result as bigint | undefined;
  const depositAmount = data?.[1]?.result as bigint | undefined;
  const depositAllowance = data?.[2]?.result as bigint | undefined;

  // extract the amount value from the form
  const amount = form.watch("amount");

  // check if the amount is greater than the mint allowance
  const needsApprove = depositAllowance !== undefined && 
    amount ? 
    depositAllowance < parseUnits(amount, 18 as number) : 
    false;

  // write contract hooks
  const { writeContract: deposit } = useWriteContract({
    address: ZEKAE_VAULT_CONTRACT_ADDRESS,
    abi: zekaeVaultAbi,
    functionName: "deposit",
  });

  const { writeContract: withdraw } = useWriteContract({
    address: ZEKAE_VAULT_CONTRACT_ADDRESS,
    abi: zekaeVaultAbi,
    functionName: "withdraw",
  });



  async function onDeposit(values: z.infer<typeof formSchema>) {
    console.log(values, "deposit");
  }

  async function onWithdraw(values: z.infer<typeof formSchema>) {
    console.log(values, "withdraw");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-2">
            <Vault className="w-10 h-10" />
            <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">Vault</h1>
          </div>
          <Button size="icon" onClick={() => refetch()}><RefreshCcw /></Button>
        </div>
        <p className="text-lg text-muted-foreground">
          You can deposit LST to the vault to mint zUSD.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Wallet</h2>
            {isFetching ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p>{formatBalance(formatUnits(currentLstBalance || BigInt(0), 18))} LST</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Deposited</h2>
            {isFetching ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p>{formatBalance(formatUnits(depositAmount || BigInt(0), 18))} LST</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onDeposit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Amount of LST to deposit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-row gap-2 items-center justify-between">
                  <h2>Token allowance</h2>
                  <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
                    <HandCoins className="w-4 h-4" />{" "}
                    {
                      depositAllowance !== undefined ? (
                        formatUnits(depositAllowance as bigint, 18)
                      ) : (
                        <Skeleton className="w-[80px] h-4" />
                      )
                    }
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => form.setValue("amount", "")}>Clear</Button>
                  <Button type="submit">Deposit</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="withdraw">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onWithdraw)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Amount of LST to withdraw.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => form.setValue("amount", "")}>Clear</Button>
                  <Button type="submit">Withdraw</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}