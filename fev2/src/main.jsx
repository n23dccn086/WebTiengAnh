import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Bỏ thẻ <StrictMode> đi để tránh việc React tự động Unmount/Remount component 2 lần
createRoot(document.getElementById('root')).render(
    <App />
)