import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import path from 'path'

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx', 'resources/css/app.css'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '~': path.resolve(__dirname, 'resources'),
        },
    },
    server: {
        host: 'localhost',
        port: 5173,
        cors: {
            origin: [
                'http://localhost:8000',
                'http://127.0.0.1:8000',
                /^http:\/\/.*\.localhost(:\d+)?$/,
            ],
        },
    },
})
