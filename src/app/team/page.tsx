import BarberCard from '@/components/BarberCard';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';

export default async function TeamPage() {
    const barbers = await prisma.user.findMany({
        where: { role: Role.FRISEUR },
    });

    return(
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold tracking-tight text-center">Unser Team</h1>
            <p className="mt-4 text-neutral-300 text-center max-w-2xl mx-auto">
                Lerne die Künstler kennen, die hinter deinem perfekten Look stehen. Jeder unserer Barber bringt seinen eigenen Stil und seine Leidenschaft mit.
            </p>
            <div className='mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center'>
                {barbers.map((barber) => (
                    <BarberCard
                        key={barber.id}
                        name={barber.name || 'Barber'}
                        role={barber.role}
                        image={'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                        bio={barber.bio}
                    />
                ))}
            </div>
        </div>
    );
}