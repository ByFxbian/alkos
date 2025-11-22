import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ALKOS Barber Vienna',
        short_name: 'ALKOS',
        description: 'Dein Go-To Barbershop am Wiedner Gürtel.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#facc15',
        orientation: 'portrait',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}