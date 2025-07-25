'use client';
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { Eye, EyeClosed, LogIn, CircleQuestionMark } from "lucide-react";
import { Button } from "@heroui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function Login() {
    const [homeUrl, setHomeUrl] = useState("");
  
    useEffect(() => {
      // 確保 homeUrl 只在客戶端設定，避免 hydration 不一致
      setHomeUrl(process.env.NEXT_PUBLIC_HOME_URL ?? "");
    }, []);

    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisbility = () => setIsVisible(!isVisible);

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
      <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
        <div className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl p-8 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide">
          <div className="flex felx-col space-x-2 text-3xl font-bold gap-2 text-white pb-6">
            <span>登入</span>
          </div>
          <div className="w-full max-w-md space-y-8 flex flex-col items-center">
            <div className="w-full transform active:scale-97 origin-center transition-all duration-300">
              <CustomInput
                label="電子郵件"
                size="sm"
              />
            </div>
            <div className="relative w-full transform active:scale-97 origin-center transition-all duration-300">
              <CustomInput
                label="密碼"
                size="sm"
                type={isVisible ? "text" : "password"}
                className="pr-12"
              />
              <Button
                isIconOnly
                variant="light"
                aria-label="切換密碼是否可見"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                type="button"
                onPress={toggleVisbility}
              >
                {isVisible ? (
                  <EyeClosed size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </Button>
            </div>
            <div className="flex w-full justify-center">
              <div className="active:scale-95 transition-all duration-200">
                <CustomButton 
                  variant="blur"
                  size="lg"
                  radius="full"
                  startContent={<LogIn size={20}/>}
                  className="text-white text-lg bg-blue-500 border-0 px-4 sm:px-6 "
                >登入</CustomButton>
              </div>
            </div>
            <div className="flex items-center w-full gap-3 text-gray-300 text-base">
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              <span>或者，使用以下方式登入</span>
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
            </div>
            <div className="flex items-center gap-10 font-normal max-w-full">
              <Button
                size="lg"
                radius="full"
                startContent={<FcGoogle size={25} className="flex-shrink-0"/>}
                className="text-lg bg-white text-black shadow-2xl"
              >
                Google
              </Button>
              <Button
                size="lg"
                radius="full"
                startContent={<FaGithub size={25} color="white" className="flex-shrink-0" />}
                className="text-lg bg-zinc-900 text-white shadow-2xl"
              >
                Github
              </Button>
            </div>
            <Link href="/signup" className="active:scale-95 transition-all duration-200 block">
              <div className="flex items-center w-full gap-3 text-gray-300 text-base">
                <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                <span>還沒有帳號嗎？ &nbsp;<span className="text-sky-300 font-bold hover:underline">立即註冊！</span></span>
                <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start">
        <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">© 2025 <span className=" text-blue-500 font-bold"><Link href={homeUrl} className="hover:underline">Share Lock</Link></span>&nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.</p>
      </div>
    </div>
  );
}