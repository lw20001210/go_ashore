'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, type ReactNode } from 'react';

export interface AntdAppProviderProps {
  children: ReactNode;
}

export function AntdAppProvider(props: AntdAppProviderProps) {
  const { children } = props;
  useEffect(() => {
    message.config({ top: 72, duration: 4, maxCount: 3 });
  }, []);

  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#2f6b49',
            borderRadius: 12,
            fontFamily: 'var(--font-app-sans)',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
