'use client';
import { FileText, LogIn, SendHorizonal, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import PageTransition from "@/components/PageTransition";

export default function Home() {
  const [homeUrl, setHomeUrl] = useState("");
  const router = useRouter();
  const logoRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const loginBtnRef = useRef<HTMLDivElement>(null);
  const pdfDownBtnRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 確保 homeUrl 只在客戶端設定，避免 hydration 不一致
    setHomeUrl(process.env.NEXT_PUBLIC_HOME_URL ?? "");
  }, []);

  // animation setup
  useEffect(() => {
    if (!logoRef.current || !titleRef.current || !formRef.current || !loginBtnRef.current || !pdfDownBtnRef.current) return;
    
    gsap.set([logoRef.current, titleRef.current, formRef.current], {
      y: -100,
      opacity: 0
    });

    gsap.set([loginBtnRef.current, pdfDownBtnRef.current], {
      scale: 0,
      opacity: 0
    });

    const tl = gsap.timeline();
    tl.to(logoRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(1.2)"
    })
    .to(titleRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.3,
      ease: "back.out(1.1)"
    }, "-=0.2")
    .to(formRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.35,
      ease: "back.out(1.1)"
    }, "-=0.15")
    .to([loginBtnRef.current, pdfDownBtnRef.current], {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: "back.out(1.7)"
    }, "-=0.2")
    .then(() => {
      console.log('Home Page Loaded.');
    });
  }, []);

  const handlePageExit = () => {
    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        onComplete: resolve
      });

      tl.to([loginBtnRef.current, pdfDownBtnRef.current], {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: "back.in(1.7)"
      })
      
      .to(formRef.current, {
        y: 200,
        opacity: 0,
        duration: 0.3,
        ease: "circ.in"
      }, "-=0.1")
      .to(titleRef.current, {
        y: 120,
        opacity: 0,
        duration: 0.25,
        ease: "expo.in"
      }, "-=0.2")
      .to(logoRef.current, {
        y: 150,
        opacity: 0,
        duration: 0.25,
        ease: "power3.in"
      }, "-=0.15");
    });
  };

  useEffect(() => {
    let isNavigating = false;
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && !isNavigating) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith('#'))) {
          e.preventDefault();
          isNavigating = true;
          await handlePageExit();
          router.push(href);
        }
      }
    };

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!isNavigating) {
        e.preventDefault();
        handlePageExit();
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router]);
  
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
      <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
        <div className="absolute top-6 right-6 flex space-x-3">
          <div ref={pdfDownBtnRef}>
            <CustomButton variant="blur" size="lg" radius="full" startContent={<FileText size={18} className="text-gray-200"/>} className="text-base hover:bg-white/20 text-gray-200">
              PDF 下載
            </CustomButton>
          </div>
          <div ref={loginBtnRef}>
            <Link href="/login" prefetch={false}>
              <CustomButton variant="blur" size="lg" radius="full" startContent={<LogIn size={18} className="text-gray-200"/>} className="text-base hover:bg-white/20 text-gray-200">
                登入
              </CustomButton>
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Image 
            ref={logoRef}
            src="/icon.svg" 
            alt="logo" 
            width={300}
            height={0}
            className="w-[70vw] sm:w-[50vw] md:w-[25vw] h-auto object-contain"
          />  
          <div ref={titleRef} className="tracking-widest text-xl md:text-2xl font-bold mb-8 mt-4 text-white">
            一個安全、高效的檔案分享軟體。
          </div>
        </div>
        <div ref={formRef} className="flex flex-col items-center justify-center relative border-2 border-white/20 w-[90%] sm:w-2/3 md:w-2/5 min-h-28 rounded-xl p-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide">
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
        <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">© 2025 <span className=" text-blue-500 font-bold"><Link href={homeUrl} className="hover:underline" prefetch={false}>Share Lock</Link></span>&nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.</p>
      </div>
    </div>
    </PageTransition>
  );
}