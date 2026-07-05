import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#E01E2B',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#F4F5F7',
          colorLink: '#E01E2B',
          borderRadius: 8,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#0C0D10',
          },
          Button: {
            colorPrimary: '#E01E2B',
            colorPrimaryHover: '#c81a26',
            colorPrimaryActive: '#A3141D',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
