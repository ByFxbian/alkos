import BarberCard from '@/components/BarberCard';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';

const teamMembers = [
    {
        id: 1,
        name: 'ALKO',
        role: 'Head of Barber',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/ALKOS.png',
        bio: ''
    },
    {
        id: 2,
        name: 'Tina',
        role: 'Managing Partner',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/TINA.png',
        bio: ''
    },
    {
        id: 3,
        name: 'Adam',
        role: 'Barber',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/ADAM.png',
        bio: ''
    },
]

export default async function TeamPage() {
    return(
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold tracking-tight text-center">Unser Team</h1>
            <p className="mt-4 text-center max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                Lerne die Künstler kennen, die hinter deinem perfekten Look stehen. Jeder unserer Barber bringt seinen eigenen Stil und seine Leidenschaft mit.
            </p>
            <div className='mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center'>
                {teamMembers.map((barber) => (
                    <BarberCard
                        key={barber.id}
                        name={barber.name}
                        role={barber.role}
                        image={barber.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                        bio={barber.bio}
                    />
                ))}
            </div>
        </div>
    );
}