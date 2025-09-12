import Image from "next/image";

type BarberCardProps = {
    name: string;
    role: string;
    image: string;
    bio?: string | null;
};

export default function BarberCard({ name, role, image, bio }: BarberCardProps) {
    return (
        <div className="bg-neutral-900 rounded-lg overflow-hidden group text-center transition-transform duration-300 ease-in-out hover:scale-105">
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
                <p className="text-gold-500">{role}</p>
                {bio && <p className="text-neutral-300 mt-2 text-sm">{bio}</p>}
            </div>
        </div>
    );
}