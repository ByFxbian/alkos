'use client'

import { useTheme } from '@/app/theme-provider'
import { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if(!isMounted) {
        return <div className='w-9 h-9' />
    }

    return (
        <button
            onClick={toggleTheme}
            className='p-2 rounded-full transition-colors'
            style={{ color: 'var(--color-text)' }}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
        </button>
    )
}