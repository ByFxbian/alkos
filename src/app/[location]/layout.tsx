import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StickyBookingButton from "@/components/StickyBookingButton";

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;

  return (
    <>
        <Navbar locationSlug={location} /> 
        <main className="flex-grow">
            {children}
        </main>
        <Footer />
        <StickyBookingButton locationSlug={location} />
    </>
  );
}