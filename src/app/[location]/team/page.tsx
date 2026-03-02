import BarberCard from '@/components/BarberCard';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function TeamPage({ params }: { params: Promise<{ location: string }> }) {
    const { location: slug } = await params;

    const locationObj = await prisma.location.findUnique({
        where: { slug }
    });

    if (!locationObj) {
        return notFound();
    }

    const teamMembers = await prisma.teamMember.findMany({
        where: {
            locations: {
                some: {
                    id: locationObj.id
                }
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    });

    return (
        <div className="container mx-auto py-12 px-4 min-h-[60vh]">
            <h1 className="text-4xl font-bold tracking-tight text-center">Unser Team ({locationObj.name})</h1>
            <p className="mt-4 text-center max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                Lerne die Künstler kennen, die hinter deinem perfekten Look stehen. Jeder unserer Barber bringt seinen eigenen Stil und seine Leidenschaft mit.
            </p>
            <div className='mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center'>
                {teamMembers.length > 0 ? (
                    teamMembers.map((barber) => (
                        <BarberCard
                            key={barber.id}
                            name={barber.name || ''}
                            role={barber.role}
                            image={barber.image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                            bio={barber.bio || undefined}
                        />
                    ))
                ) : (
                    <p className="text-center col-span-full text-neutral-500 mt-10">
                        Noch keine Teammitglieder für diesen Standort eingetragen.
                    </p>
                )}
            </div>
        </div>
    );
}