# บันทึกอ้างอิงการตั้งค่า PWA

เอกสารทางการของ Expo ระบุว่าโปรเจกต์เว็บสามารถเพิ่ม PWA Manifest ได้ด้วยไฟล์ `public/manifest.json` และสามารถตั้งให้ใช้งานแบบติดตั้งได้โดยเชื่อมไฟล์ Manifest ในเอกสาร HTML ของแอป สำหรับเว็บที่ใช้ `web.output: "static"` ควรใช้ `app/+html.tsx` เพื่อกำหนดแท็ก `<head>` ของทุกหน้า รวมถึงแท็ก Manifest และสคริปต์ลงทะเบียน Service Worker [1]

การเผยแพร่ทรัพยากรแบบ static ของ Expo Router ใช้โฟลเดอร์ `public` ซึ่งจะถูกคัดลอกไปยังโฟลเดอร์ผลลัพธ์ของการ export เว็บ โดย Expo Router ที่ใช้ Metro รองรับการทำ static rendering และกำหนด HTML shell ผ่าน `app/+html.tsx` [2]

Service Worker ของโปรเจกต์นี้มีขอบเขตแคชแบบระมัดระวัง: จะเก็บ app shell และทรัพยากรที่เข้าถึงแล้วในโดเมนเดียวกัน พร้อมหน้า fallback เมื่อออฟไลน์ เพื่อไม่ให้การแคชเชิงรุกทำให้ผู้ใช้ได้รับเวอร์ชันเก่าเป็นเวลานาน ตามคำเตือนในเอกสาร Expo [1]

## References

[1] [Expo — Progressive web apps](https://docs.expo.dev/guides/progressive-web-apps/)

[2] [Expo Router — Migrate from Expo Webpack](https://docs.expo.dev/router/migrate/from-expo-webpack/)
