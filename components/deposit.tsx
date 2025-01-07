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
import { formatUnits } from "viem";
import { lstokenAbi, zekaeVaultAbi } from "@/lib/abis";
import { getSigpassWallet } from "@/lib/sigpass";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { localConfig } from "@/app/providers";
import { formatBalance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


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
    ],
    config: address ? localConfig : config,
  });

  // extract the data from the read contracts hook
  const currentLstBalance = data?.[0]?.result as bigint | undefined;
  const depositAmount = data?.[1]?.result as bigint | undefined;


  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-2">
            <Vault className="w-10 h-10" />
            <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">Your deposit</h1>
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
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline">Withdraw</Button>
          <Button>Deposit</Button>
        </div>
      </div>
    </div>
  );
}