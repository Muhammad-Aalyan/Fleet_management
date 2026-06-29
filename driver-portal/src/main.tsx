import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316',
          colorBgContainer: '#1e1e2e',
          colorBgLayout: '#13131f',
          borderRadius: 10,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#16162a',
            headerBg: '#1e1e2e',
            triggerBg: '#0f0f1a',
          },
          Menu: {
            darkItemBg: '#16162a',
            darkSubMenuItemBg: '#0f0f1a',
            darkItemSelectedBg: '#f97316',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
