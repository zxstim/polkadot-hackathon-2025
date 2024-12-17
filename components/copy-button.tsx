import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";

export default function CopyButton({
  copyText  
}: {
  copyText: Address | string | null;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(copyText ? copyText : "");
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={copy}>
      <Copy className="w-4 h-4" />
    </Button>
  )
}
