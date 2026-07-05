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
            siderBg: '#0C0D10',
            headerBg: '#ffffff',
            triggerBg: '#16171C',
          },
          Menu: {
            darkItemBg: '#0C0D10',
            darkSubMenuItemBg: '#0C0D10',
            darkItemSelectedBg: 'rgba(224,30,43,0.18)',
            darkItemSelectedColor: '#ffffff',
            darkItemColor: '#B7B9C2',
            darkItemHoverBg: '#1B1C22',
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
