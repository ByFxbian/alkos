'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({children}: {children: ReactNode}) {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null
        if(storedTheme) {
            setTheme(storedTheme)
            document.documentElement.classList.add(storedTheme)
        } else {
            document.documentElement.classList.add('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.remove(theme)
        document.documentElement.classList.add(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if(context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}