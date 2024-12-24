# DOT UI Kit

This is an opinionated UI scaffolding kit for the Polkadot ecosystem (starting with Asset Hub). The technical stack is:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide icons](https://lucide.dev/)
- [ShadCN UI](https://ui.shadcn.com/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [Jotai](https://jotai.org/)
- [Tanstack React Query](https://tanstack.com/query)
- [Vaul](https://vaul.fun/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

## Getting started

```
git clone https://github.com/buildstationorg/dotui.git
cd dotui
npm install
```

## Running the project

```
npm run dev
```
Default port is 3002. You can change the port in the `package.json` file.

```json
"scripts": {
  "dev": "next dev -p 3002", // Change the port here to -p <port>
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
},
```

## Building the project

```
npm run build
```

