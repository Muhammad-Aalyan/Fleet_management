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
          colorPrimary: '#1677ff',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f0f2f5',
          borderRadius: 8,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#001529',
            headerBg: '#ffffff',
            triggerBg: '#002140',
          },
          Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
            darkItemSelectedBg: '#1677ff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
