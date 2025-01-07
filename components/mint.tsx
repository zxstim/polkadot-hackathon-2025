export default function Mint() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-4">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">Your mint supply</h1>
        <p className="text-lg text-muted-foreground">You can mint zUSD by depositing LST.</p>
      </div>
    </div>
  );
}
