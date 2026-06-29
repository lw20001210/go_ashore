import type { Metadata, Viewport } from "next";
import { AntdAppProvider } from "@/components/antd-app-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "上岸日程",
  description: "面向在职考公人的 AI 每日备考计划器",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <head>
        {/* 阻止百度 App 内置浏览器转码（转码会剥离 CSS） */}
        <meta httpEquiv="Cache-Control" content="no-transform" />
        <meta httpEquiv="Cache-Control" content="no-siteapp" />
        <meta name="applicable-device" content="pc,mobile" />
      </head>
      <body className="min-h-full bg-[#f3efe6]">
        <AntdAppProvider>
          {children}
        </AntdAppProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
