import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StickyBookingButton from "@/components/StickyBookingButton";
import LocationThemeWrapper from "@/components/LocationThemeWrapper";

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;

  return (
    <LocationThemeWrapper locationSlug={location}>
        <Navbar locationSlug={location} /> 
        <main className="flex-grow">
            {children}
        </main>
        <Footer />
        <StickyBookingButton locationSlug={location} />
    </LocationThemeWrapper>
  );
}