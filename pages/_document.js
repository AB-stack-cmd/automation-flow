import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html className="dark" lang="en">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </Head>
      <body className="bg-[#131313] text-[#e5e2e1] selection:bg-[#facc15]/30 selection:text-[#ffe083] font-sans overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
