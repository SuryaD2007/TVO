import { ApplyProvider } from "@/components/apply-context";
import { Apply } from "@/components/apply";
import { Distinction } from "@/components/distinction";
import { Ecosystem } from "@/components/ecosystem";
import { Engine } from "@/components/engine";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <ApplyProvider>
      <a
        href="#apply"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-accent-ink"
      >
        Skip to application
      </a>
      <Navbar />
      <main className="overflow-x-clip">
        <Hero />
        <Distinction />
        <Engine />
        <Ecosystem />
        <Apply />
      </main>
      <Footer />
    </ApplyProvider>
  );
}
