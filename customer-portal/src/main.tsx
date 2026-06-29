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
          colorPrimary: '#7c3aed',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8f7ff',
          borderRadius: 10,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#ffffff',
          },
          Menu: {
            itemSelectedBg: '#ede9fe',
            itemSelectedColor: '#7c3aed',
            itemActiveBg: '#ede9fe',
          },
          Button: {
            colorPrimary: '#7c3aed',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
