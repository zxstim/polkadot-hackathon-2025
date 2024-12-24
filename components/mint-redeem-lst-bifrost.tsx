"use client";

import { useState, useEffect } from "react";
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useConfig,
  useWriteContract,
  useReadContracts,
  useAccount,
  useBalance,
} from "wagmi";
import { parseUnits, formatUnits, formatEther } from "viem";
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
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { truncateHash } from "@/lib/utils";
import CopyButton from "@/components/copy-button";
import { getSigpassWallet } from "@/lib/sigpass";
import { westendAssetHub } from "@/app/providers";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { Skeleton } from "./ui/skeleton";
import { localConfig } from "@/app/providers";

export default function MintRedeemLstBifrost() {
  // useConfig hook to get config
  const config = useConfig();

  // useAccount hook to get account
  const account = useAccount();

  // useMediaQuery hook to check if the screen is desktop
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // useState hook to open/close dialog/drawer
  const [open, setOpen] = useState(false);

  // get the address from session storage
  const address = useAtomValue(addressAtom);

  // useWriteContract hook to write contract
  const {
    data: hash,
    error,
    isPending,
    writeContractAsync,
  } = useWriteContract({
    config: address ? localConfig : config,
  });

  const XCDOT_CONTRACT_ADDRESS = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";
  const XCASTR_CONTRACT_ADDRESS = "0xFfFFFfffA893AD19e540E172C10d78D4d479B5Cf";
  const XCBNC_CONTRACT_ADDRESS = "0xFFffffFf7cC06abdF7201b350A1265c62C8601d2";
  const BIFROST_SLPX_CONTRACT_ADDRESS =
    "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8";

  // Get the contract address based on selected token
  const getContractAddress = (token: string) => {
    switch (token) {
      case "xcdot":
        return XCDOT_CONTRACT_ADDRESS;
      case "xcastr":
        return XCASTR_CONTRACT_ADDRESS;
      case "xcbnc":
        return XCBNC_CONTRACT_ADDRESS;
      default:
        return XCDOT_CONTRACT_ADDRESS;
    }
  };

  // form schema for sending transaction
  const formSchema = z.object({
    // token is a required field selected from a list
    token: z.enum(["xcdot", "glmr", "xcastr", "xcbnc"], {
      required_error: "Please select a token",
    }),
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
        if (!maxBalance || !decimals) return;

        const inputAmount = parseUnits(val, decimals as number);

        if (inputAmount > (maxBalance as bigint)) {
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
      token: "xcdot",
      amount: "",
    },
  });


  // Extract the token value using watch instead of getValues
  const selectedToken = form.watch("token");

  // useReadContracts hook to read contract
  const { data, refetch } = useReadContracts({
    contracts: [
      {
        address: getContractAddress(selectedToken),
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ? address : account.address],
      },
      {
        address: getContractAddress(selectedToken),
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: getContractAddress(selectedToken),
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: getContractAddress(selectedToken),
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          address ? address : account.address,
          BIFROST_SLPX_CONTRACT_ADDRESS,
        ],
      },
    ],
    query: {
      enabled: selectedToken !== "glmr",
    },
    config: address ? localConfig : config,
  });


  // extract the data from the read contracts hook
  const maxBalance = data?.[0]?.result as bigint | undefined;
  const symbol = data?.[1]?.result as string | undefined;
  const decimals = data?.[2]?.result as number | undefined;
  const mintAllowance = data?.[3]?.result as bigint | undefined;

  // extract the amount value from the form
  const amount = form.watch("amount");

  // check if the amount is greater than the mint allowance
  const needsApprove = mintAllowance !== undefined && 
    amount ? 
    mintAllowance <= parseUnits(amount, decimals || 18) : 
    false;


      // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // if the user has a sigpass wallet, and the token is not GLMR, approve the token
    if (address && selectedToken !== "glmr") {
      if (needsApprove) {
        writeContractAsync({
          account: await getSigpassWallet(),
          address: getContractAddress(values.token),
          abi: erc20Abi,
          functionName: "approve",
          args: [BIFROST_SLPX_CONTRACT_ADDRESS, parseUnits(values.amount, decimals as number)],
        });
      }
    }

    // if the user does not have a sigpass wallet, and the token is not GLMR, mint the token
    if (!address && selectedToken !== "glmr") {
      writeContractAsync({
        address: getContractAddress(values.token),
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          BIFROST_SLPX_CONTRACT_ADDRESS,
          parseUnits(values.amount, decimals as number),
        ],
      });
    }

    
    // if (address) {
    //   writeContractAsync({
    //     account: await getSigpassWallet(),
    //     address: USDC_CONTRACT_ADDRESS,
    //     abi: erc20Abi,
    //     functionName: "transfer",
    //     args: [
    //       values.address as Address,
    //       parseUnits(values.amount, decimals as number),
    //     ],
    //     chainId: westendAssetHub.id,
    //   });
    // } else {
    //   // Fallback to connected wallet
    //   console.log(decimals);
    //   writeContractAsync({
    //     address: USDC_CONTRACT_ADDRESS,
    //     abi: erc20Abi,
    //     functionName: "transfer",
    //     args: [
    //       values.address as Address,
    //       parseUnits(values.amount, decimals as number),
    //     ],
    //     chainId: westendAssetHub.id,
    //   });
    // }
  }

  // Add useBalance hook for GLMR
  const { data: glmrBalance } = useBalance({
    address: address ? address : account.address,
    query: {
      enabled: selectedToken === "glmr",
    },
    config: address ? localConfig : config,
  });

  // Watch for transaction hash and open dialog/drawer when received
  useEffect(() => {
    if (hash) {
      setOpen(true);
    }
  }, [hash]);

  // useWaitForTransactionReceipt hook to wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      config: address ? localConfig : config,
    });

  // when isConfirmed, refetch the balance of the address
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  return (
    <Tabs defaultValue="mint" className="w-[320px] md:w-[425px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="mint">Mint</TabsTrigger>
        <TabsTrigger value="redeem">Redeem</TabsTrigger>
      </TabsList>
      <TabsContent value="mint">
        <div className="flex flex-col gap-4 w-[320px] md:w-[425px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a token" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Tokens</SelectLabel>
                            <SelectItem value="xcdot">xcDOT</SelectItem>
                            <SelectItem value="glmr">GLMR</SelectItem>
                            <SelectItem value="xcastr">xcASTR</SelectItem>
                            <SelectItem value="xcbnc">xcBNC</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>The token to mint</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row gap-2 items-center justify-between">
                      <FormLabel>Amount</FormLabel>
                      <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
                        <WalletMinimal className="w-4 h-4" />{" "}
                        {selectedToken === "glmr" ? (
                          glmrBalance ? (
                            formatEther(glmrBalance.value)
                          ) : (
                            <Skeleton className="w-[80px] h-4" />
                          )
                        ) : (
                          maxBalance !== undefined ? (
                            formatUnits(maxBalance as bigint, decimals as number)
                          ) : (
                            <Skeleton className="w-[80px] h-4" />
                          )
                        )}{" "}
                        {selectedToken === "glmr" ? (
                          "GLMR"
                        ) : (
                          symbol ? (
                            symbol
                          ) : (
                            <Skeleton className="w-[40px] h-4" />
                          )
                        )}
                      </div>
                    </div>
                    <FormControl>
                      {isDesktop ? (
                        <Input
                          type="number"
                          placeholder="0.001"
                          {...field}
                          required
                        />
                      ) : (
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          placeholder="0.001"
                          {...field}
                          required
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      The amount of {selectedToken === "glmr" ? "GLMR" : symbol} to mint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-row gap-2 items-center justify-between">
                <h2>Token allowance</h2>
                <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
                  <HandCoins className="w-4 h-4" />{" "}
                  {selectedToken === "glmr" ? (
                    glmrBalance ? (
                      formatEther(glmrBalance.value)
                    ) : (
                      <Skeleton className="w-[80px] h-4" />
                    )
                  ) : (
                    mintAllowance !== undefined ? (
                      formatUnits(mintAllowance as bigint, decimals as number)
                    ) : (
                      <Skeleton className="w-[80px] h-4" />
                    )
                  )}{" "}
                  {selectedToken === "glmr" ? (
                    "GLMR"
                  ) : (
                    symbol ? (
                      symbol
                    ) : (
                      <Skeleton className="w-[40px] h-4" />
                    )
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-2 items-center justify-between">
                <h2>You are about to mint this token</h2>
                <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
                  {
                    selectedToken === "glmr" ? (
                      "xcvGLMR"
                    ) : selectedToken === "xcdot" ? (
                      "xcvDOT"
                    ) : selectedToken === "xcastr" ? (
                      "xcvASTR"
                    ) : selectedToken === "xcbnc" ? (
                      "xcvBNC"
                    ) : (
                      <Skeleton className="w-[40px] h-4" />
                    )
                  }
                </div>
              </div>
              <div className="flex flex-row gap-2 items-center justify-between">
                {
                  isPending ? (
                    <Button type="submit" disabled className="w-full">
                      <LoaderCircle className="w-4 h-4 animate-spin" /> Confirm in
                      wallet...
                    </Button>
                  ) : needsApprove ? (
                    <Button type="submit" className="w-full">Approve</Button>
                  ) : (
                    <Button disabled className="w-full">Approve</Button>
                  )
                }
                {isPending ? (
                  <Button type="submit" disabled className="w-full">
                    <LoaderCircle className="w-4 h-4 animate-spin" /> Confirm in
                    wallet...
                  </Button>
                ) : needsApprove ? (
                  <Button disabled className="w-full">
                    Send
                  </Button>
                ) : (
                  <Button type="submit" className="w-full">
                    Send
                  </Button>
                )}
              </div>

            </form>
          </Form>
          {
            // Desktop would be using dialog
            isDesktop ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Transaction status <ChevronDown />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transaction status</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    Follow the transaction status below.
                  </DialogDescription>
                  <div className="flex flex-col gap-2">
                    {hash ? (
                      <div className="flex flex-row gap-2 items-center">
                        <Hash className="w-4 h-4" />
                        Transaction Hash
                        <a
                          className="flex flex-row gap-2 items-center underline underline-offset-4"
                          href={`${config.chains?.[0]?.blockExplorers?.default?.url}/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {truncateHash(hash)}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <CopyButton copyText={hash} />
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 items-center">
                        <Hash className="w-4 h-4" />
                        No transaction hash
                      </div>
                    )}
                    {!isPending && !isConfirmed && !isConfirming && (
                      <div className="flex flex-row gap-2 items-center">
                        <Ban className="w-4 h-4" /> No transaction submitted
                      </div>
                    )}
                    {isConfirming && (
                      <div className="flex flex-row gap-2 items-center text-yellow-500">
                        <LoaderCircle className="w-4 h-4 animate-spin" />{" "}
                        Waiting for confirmation...
                      </div>
                    )}
                    {isConfirmed && (
                      <div className="flex flex-row gap-2 items-center text-green-500">
                        <CircleCheck className="w-4 h-4" /> Transaction
                        confirmed!
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-row gap-2 items-center text-red-500">
                        <X className="w-4 h-4" /> Error:{" "}
                        {(error as BaseError).shortMessage || error.message}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              // Mobile would be using drawer
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Transaction status <ChevronDown />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Transaction status</DrawerTitle>
                    <DrawerDescription>
                      Follow the transaction status below.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="flex flex-col gap-2 p-4">
                    {hash ? (
                      <div className="flex flex-row gap-2 items-center">
                        <Hash className="w-4 h-4" />
                        Transaction Hash
                        <a
                          className="flex flex-row gap-2 items-center underline underline-offset-4"
                          href={`${config.chains?.[0]?.blockExplorers?.default?.url}/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {truncateHash(hash)}
                          <ExternalLink className="w-4 h-4" />
                          <CopyButton copyText={hash} />
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 items-center">
                        <Hash className="w-4 h-4" />
                        No transaction hash
                      </div>
                    )}
                    {!isPending && !isConfirmed && !isConfirming && (
                      <div className="flex flex-row gap-2 items-center">
                        <Ban className="w-4 h-4" /> No transaction submitted
                      </div>
                    )}
                    {isConfirming && (
                      <div className="flex flex-row gap-2 items-center text-yellow-500">
                        <LoaderCircle className="w-4 h-4 animate-spin" />{" "}
                        Waiting for confirmation...
                      </div>
                    )}
                    {isConfirmed && (
                      <div className="flex flex-row gap-2 items-center text-green-500">
                        <CircleCheck className="w-4 h-4" /> Transaction
                        confirmed!
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-row gap-2 items-center text-red-500">
                        <X className="w-4 h-4" /> Error:{" "}
                        {(error as BaseError).shortMessage || error.message}
                      </div>
                    )}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            )
          }
        </div>
      </TabsContent>
      <TabsContent value="redeem">placeholder</TabsContent>
    </Tabs>
  );
}

const erc20Abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "initialOwner",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ECDSAInvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    name: "ECDSAInvalidSignatureLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "ECDSAInvalidSignatureS",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "ERC2612ExpiredSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC2612InvalidSigner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "maxLoan",
        type: "uint256",
      },
    ],
    name: "ERC3156ExceededMaxLoan",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC3156InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "ERC3156UnsupportedToken",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "currentNonce",
        type: "uint256",
      },
    ],
    name: "InvalidAccountNonce",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "StringTooLong",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "burnFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "flashFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC3156FlashBorrower",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "flashLoan",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "maxFlashLoan",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const xcdotAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "who", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
