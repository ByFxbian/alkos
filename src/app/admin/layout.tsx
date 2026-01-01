import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLocationFilter from "@/components/AdminLocationFilter";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER', 'BARBER'].includes(session.user.role)) {
      redirect('/api/auth/signin');
  }

  let availableLocations: {id: string, name: string}[] = [];
  if (session.user.role === 'ADMIN') {
      availableLocations = await prisma.location.findMany({ select: { id: true, name: true } });
  } else {
      const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { locations: { select: { id: true, name: true } } }
      });
      availableLocations = user?.locations || [];
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row">
       <div className="hidden md:flex w-64 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex-col">
          <div className="p-6 border-b border-[var(--color-border)] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--color-gold-500)] rounded-full flex items-center justify-center font-bold text-black font-serif">A</div>
                  <span className="font-serif font-bold text-xl tracking-tight text-[var(--color-text)]">ALKOS</span>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] ml-auto bg-[var(--color-surface-3)] px-1 py-0.5 rounded">Admin</span>
              </div>
              <Link href="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-500)] flex items-center gap-1 transition-colors">
                  ← Zurück zur Webseite
              </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
             <NavLink href="/admin/dashboard" label="Dashboard" icon="LayoutDashboard" />
             <NavLink href="/admin/kalender" label="Kalender & Zeiten" icon="Calendar" />
             
             {(session.user.role === 'ADMIN' || session.user.role === 'HEADOFBARBER') && (
                 <>
                    <div className="pt-6 pb-2 px-3 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold opacity-60">Verwaltung</div>
                    <NavLink href="/admin/friseure" label="Team & User" icon="Users" />
                    <NavLink href="/admin/services" label="Services" icon="Scissors" />
                    <NavLink href="/admin/locations" label="Standorte" icon="MapPin" />
                    <NavLink href="/admin/web-team" label="Website Team" icon="Globe" />
                 </>
             )}
          </nav>

          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-3)] overflow-hidden border border-[var(--color-border)]">
                       {session.user.image ? (
                           <Image src={session.user.image} alt="User" width={40} height={40} className="object-cover h-full w-full" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center font-bold text-[var(--color-text)]">U</div>
                       )}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate text-[var(--color-text)]">{session.user.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{session.user.email}</p>
                  </div>
              </div>
              <SignOutButton className="w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded border border-[var(--color-border)] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors" />
          </div>
       </div>

       <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-10 shadow-sm">
               <div className="md:hidden flex items-center gap-4">
                   <Link href="/" className="font-serif font-bold text-lg">ALKOS</Link>
               </div>
               
               <h2 className="hidden md:block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
                   Administration / {session.user.role}
               </h2>
               
               <div className="flex items-center gap-4">
                   <span className="text-xs font-mono text-[var(--color-text-muted)] hidden lg:inline-block">
                       {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                   </span>
                   
                   {availableLocations.length > 1 && (
                       <div className="relative z-20">
                           <AdminLocationFilter locations={availableLocations} />
                       </div>
                   )}
               </div>
          </header>
          
          <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] text-[var(--color-text)] relative p-0 scroll-smooth">
               <div className="md:hidden flex overflow-x-auto gap-2 p-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <Link href="/admin/dashboard" className="px-3 py-1.5 text-xs border rounded">Dashboard</Link>
                    <Link href="/admin/kalender" className="px-3 py-1.5 text-xs border rounded">Kalender</Link>
                    {(session.user.role === 'ADMIN' || session.user.role === 'HEADOFBARBER') && (
                        <>
                            <Link href="/admin/friseure" className="px-3 py-1.5 text-xs border rounded">Team</Link>
                            <Link href="/admin/locations" className="px-3 py-1.5 text-xs border rounded">Locations</Link>
                        </>
                    )}
               </div>

               {children}
          </main>
       </div>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string, label: string, icon: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-all group">
             <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">
                {icon === 'LayoutDashboard' && '📊'}
                {icon === 'Calendar' && '📅'}
                {icon === 'Users' && '👥'}
                {icon === 'Scissors' && '✂️'}
                {icon === 'MapPin' && '📍'}
                {icon === 'Globe' && '🌐'}
             </span>
             {label}
        </Link>
    )
}