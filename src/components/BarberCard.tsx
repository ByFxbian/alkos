import Image from "next/image";

type BarberCardProps = {
    name: string;
    role: string;
    imageUrl: string;
};

export default function BarberCard({ name, role, imageUrl }: BarberCardProps) {
    return (
        <div className="bg-neutral-900 rounded-lg overflow-hidden group text-center">
            <div className="relative w-full h-80">
                <Image
                    src={imageUrl}
                    alt={`Foto von ${name}`}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-110 transition-transform duration-500 ease-in-out"
                />
            </div>
            <div className="p-5">
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="text-amber-400">{role}</p>
            </div>
        </div>
    );
}