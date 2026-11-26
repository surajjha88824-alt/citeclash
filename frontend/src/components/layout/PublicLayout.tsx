import React from "react";
import { Navbar } from "../landing/Navbar";
import { DarkCTAAndFooter } from "../landing/DarkCTAAndFooter";

interface PublicLayoutProps {
  onOpenAuth?: (mode?: "login" | "signup") => void;
  onOpenApp?: () => void;
  onNavigate?: (path: string) => void;
  user?: any;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  onOpenAuth = () => {},
  onOpenApp = () => {},
  onNavigate,
  user,
  children,
}) => {
  return (
    <div className="min-h-screen w-full bg-white text-[#111113] font-sans antialiased overflow-x-clip">
      <Navbar
        onOpenAuth={onOpenAuth}
        onOpenApp={onOpenApp}
        onNavigate={onNavigate}
        user={user}
      />
      <main className="pt-16">{children}</main>
      <DarkCTAAndFooter onOpenAuth={onOpenAuth} onNavigate={onNavigate} />
    </div>
  );
};
