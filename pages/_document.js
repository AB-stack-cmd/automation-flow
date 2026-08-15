import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html className="dark" lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.tailwind = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      "primary": "#ff4f00",
                      "on-primary": "#ffffff",
                      "canvas": "#09090b",
                      "surface": "#141417",
                      "card": "#18181b",
                      "border-color": "#27272a",
                    }
                  }
                }
              };
              try {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              } catch (e) {}
            `,
          }}
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mona+Sans:wght@500;600;700&family=JetBrains+Mono:wght@500&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </Head>
      <body className="bg-[#09090b] text-[#f4f4f5] selection:bg-[#ff4f00]/30 selection:text-[#ff4f00] font-sans overflow-x-hidden transition-colors duration-200">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


