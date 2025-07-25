'use client';
import { LogIn, SendHorizonal, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";

export default function Home() {
  const [homeUrl, setHomeUrl] = useState("");
  
  useEffect(() => {
    // 確保 homeUrl 只在客戶端設定，避免 hydration 不一致
    setHomeUrl(process.env.NEXT_PUBLIC_HOME_URL ?? "");
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
      <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
        <div className="absolute top-6 right-6">
          <CustomButton variant="blur" size="lg" radius="full" startContent={<LogIn size={18} className="text-gray-200"/>} className="text-base hover:bg-white/20 text-gray-200">
            登入
          </CustomButton>
        </div>
        <div className="flex flex-col items-center">
          <Image 
            src="/icon.svg" 
            alt="logo" 
            width={300}
            height={0}
            className="w-[70vw] sm:w-[50vw] md:w-[25vw] h-auto object-contain"
          />  
          <div className="tracking-widest text-xl md:text-2xl font-bold mb-8 mt-4 text-white">
            一個安全、高效的檔案分享軟體。
          </div>
        </div>
        <div className="flex flex-col items-center justify-center relative border-2 border-white/20 w-[90%] sm:w-2/3 md:w-2/5 min-h-28 rounded-xl p-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide">
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="flex flex-col xl:flex-row items-center space-y-3 xl:space-y-0 lg:space-x-3 w-full">
              <div className="relative flex-1 w-full xl:w-auto transition-all duration-300 active:scale-98">
                <CustomInput
                  size="sm"
                  label="輸入分享連結？"
                  className="w-full pr-20"
                >
                </CustomInput>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="overflow-hidden rounded-full">
                    <CustomButton 
                      variant="blur" 
                      size="sm"
                      radius="full"
                      startContent={<SendHorizonal size={18} className="text-sky-300 group-hover:text-gray-800 transition-colors duration-200"/>}
                      className=" bg-white/15 border-white/20 border hover:bg-sky-400 hover:text-gray-800 !min-w-8 h-8 overflow-visible"
                    >
                    </CustomButton>
                  </div>
                </div>
              </div>
              <div className="text-white/70 px-3 text-lg">或者</div>
              <div className="overflow-hidden rounded-full shadow-2xl">
                <CustomButton variant="blur" size="lg" radius="full" startContent={<Upload size={20} className="text-green-400 group-hover:text-gray-800 transition-colors duration-200"/>} className="text-lg hover:bg-emerald-400 hover:text-gray-800 text-gray-200 lg:w-auto justify-center overflow-visible group">
                  上傳檔案
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start">
        <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">© 2025 <span className=" text-blue-500 font-bold"><Link href={homeUrl} className="hover:underline">Share Lock</Link></span>&nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.</p>
      </div>
    </div>
  );
}