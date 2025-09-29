import Image from "next/image";

type BarberCardProps = {
    name: string;
    role: string;
    image: string;
    bio?: string | null;
};

const getRoleDisplayName = (role: string) => {
    switch (role) {
        case 'BARBER':
            return 'Barber';
        case 'HeadOfBarber':
            return 'Head of Barber';
        default:
            return role;
    }
};

export default function BarberCard({ name, role, image, bio }: BarberCardProps) {
    const roleDisplayName = getRoleDisplayName(role);

    return (
        <div className="rounded-lg overflow-hidden group text-center transition-transform duration-300 ease-in-out hover:scale-105" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="relative w-full h-80">
                <Image
                    src={image}
                    alt={`Foto von ${name}`}
                    fill
                    style={{ objectFit: "cover" }}
                />
            </div>
            <div className="p-5">
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="text-gold-500">{roleDisplayName}</p>
                {bio && <p className=" mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{bio}</p>}
            </div>
        </div>
    );
}