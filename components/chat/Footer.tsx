import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#f1f1f2] flex flex-col items-center overflow-hidden px-10 py-6 shrink-0 w-full">
      <div className="flex items-center gap-6 max-w-[1104px] w-full">
        {/* Logo + Copyright */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-10 h-10">
            <Image
              src="/postnl-logo.svg"
              alt="PostNL"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[#1f1e2f] text-sm leading-6 whitespace-nowrap">
            © Koninklijke PostNL
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-1 items-center justify-end gap-6 text-sm leading-6 text-[#1f1e2f] whitespace-nowrap">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Cookies</a>
          <a href="#" className="hover:underline">Gebruiksvoorwaarden</a>
          <a href="#" className="hover:underline">Algemene voorwaarden</a>
        </nav>
      </div>
    </footer>
  );
}
