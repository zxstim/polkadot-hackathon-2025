"use client";

import {
  type BaseError,
  useWaitForTransactionReceipt,
  useConfig,
  useWriteContract,
  useReadContracts,
  useAccount
} from "wagmi";
import { formatUnits } from "viem";
import { lstokenAbi, zekaeVaultAbi, zusdAbi } from "@/lib/abis";
import { getSigpassWallet } from "@/lib/sigpass";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { localConfig } from "@/app/providers";


export default function Deposit() {
  // useConfig hook to get config
  const config = useConfig();

  // useAccount hook to get account
  const account = useAccount();

  // get the address from session storage
  const address = useAtomValue(addressAtom);

  const LST_CONTRACT_ADDRESS = "0xac329056F5d04C1125d8d3500cD2dF819eD9cA86";
  const ZUSD_CONTRACT_ADDRESS = "0x43bF52395Da87278AA56024D8879d749ee6Fa0B2";
  const ZEKAE_VAULT_CONTRACT_ADDRESS = "0xF2cBA4d5C9A1A0b15bFCa4Db467422dcddB628e0";


  // useReadContracts hook to read contract
  const { data, refetch: refetchBalance } = useReadContracts({
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
      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-4">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">Your deposit</h1>
        <p className="text-lg text-muted-foreground">
          You can deposit LST to the contract to mint zUSD.
        </p>
        <h2 className="text-xl font-semibold tracking-tight">Wallet</h2>
        <p>{formatUnits(currentLstBalance || BigInt(0), 18)} LST</p>
        <h2 className="text-xl font-semibold tracking-tight">Deposited</h2>
        <p>{formatUnits(depositAmount || BigInt(0), 18)} LST</p>
      </div>
    </div>
  );
}