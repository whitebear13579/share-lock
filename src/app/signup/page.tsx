'use client';
import React from "react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { CircleAlert, Eye, EyeClosed, LogIn } from "lucide-react";
import { Button } from "@heroui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import PageTransition from "@/components/pageTransition";
import ProtectedRoute from "@/components/protectedRoute";
import { auth } from "@/utils/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  updateProfile
} from "firebase/auth";
import CryptoJS from 'crypto-js';
import { Spinner } from "@heroui/react";


export default function Signup() {
    const router = useRouter();
    const formContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);

    const [username, setUsername] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const [usernameError, setUsernameError] = React.useState("");
    const [emailError, setEmailError] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");
    const [confirmPasswordError, setConfirmPasswordError] = React.useState("");

    const [isPwdVisible, setIsPwdVisible] = React.useState(false);
    const toggleVisbility = () => setIsPwdVisible(!isPwdVisible);

    const [isPwdRepeatVisible, setIsPwdRepeatVisible] = React.useState(false);
    const toggleRepeatVisbility = () => setIsPwdRepeatVisible(!isPwdRepeatVisible);

    const clearFieldErrors = () => {
        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setConfirmPasswordError("");
        setError("");
    };

    const validateForm = () => {
        clearFieldErrors();
        let isValid = true;

        if (!username.trim()) {
            setUsernameError("請輸入使用者名稱");
            isValid = false;
        }

        if (username.length >  20) {
            setUsernameError("使用者名稱需小於 20 字元");
            isValid = false;
        }
        
        if (!email.trim()) {
            setEmailError("請輸入電子郵件");
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("電子郵件格式不正確");
            isValid = false;
        }
        
        if (password.length < 8) {
            setPasswordError("密碼至少須 8 個字元");
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            setConfirmPasswordError("密碼不一致");
            isValid = false;
        }

        return isValid;
    };

    // regular register
    const handleEmailSignup = async () => {
      if (!validateForm()) return;
      
      setIsLoading(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const trimmedEmail = email.trim().toLowerCase();
        const hashedEmail = CryptoJS.SHA256(trimmedEmail).toString();
        
        await updateProfile(userCredential.user, {
          displayName: username,
          photoURL: `https://www.gravatar.com/avatar/${hashedEmail}`
        });

        router.push("/dashboard");
      } catch (error: any) {
        console.error("Regular register FAILED!!!:", error);
        switch (error.code) {
          case 'auth/email-already-in-use':
            setEmailError("此電子郵件已被使用");
            break;
          case 'auth/invalid-email':
            setEmailError("電子郵件格式不正確");
            break;
          case 'auth/weak-password':
            setPasswordError("密碼強度不足");
            break;
          case 'auth/too-many-requests':
            setError("受到速率限制，請稍後再試");
            break;
          default:
            setError("註冊失敗，請重試");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // register via google 
    const handleGoogleSignup = async () => {
      setIsLoading(true);
      setError("");

      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Google register FAILED!!!:", error);
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            setError("電子郵件已使用其他方式註冊");
            break;
          case 'auth/popup-blocked':
            setError("彈出視窗遭到封鎖");
            break;
          case 'auth/cancelled-popup-request':
            break;
          case 'auth/too-many-requests':
            setError("受到速率限制，請稍後再試");
            break;
          default:
            setError("使用 Google 註冊失敗，請重試");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // register via github
    const handleGithubSignup = async () => {
      setIsLoading(true);
      setError("");

      try {
        const provider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, provider);
        router.push("/dashboard");
      } catch (error: any) {
        console.error("GitHub register FAILED!!!:", error);
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            setError("電子郵件已使用其他方式註冊");
            break;
          case 'auth/popup-blocked':
            setError("彈出視窗遭到封鎖");
            break;
          case 'auth/cancelled-popup-request':
            break;
          case 'auth/too-many-requests':
            setError("受到速率限制，請稍後再試");
            break;
          default:
            setError("使用 GitHub 註冊失敗，請重試");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // animation setup
    const animateErrorBox = () => {
      if (!errorBoxRef.current || !formContainerRef.current) return;

      gsap.set(errorBoxRef.current, {
        scale: 0.8,
        opacity: 0,
        height: 0,
        marginBottom: 0,
      });

      const tl = gsap.timeline();
      
      tl.to(errorBoxRef.current, {
        height: "auto",
        marginBottom: "0.5rem",
        duration: 0.2,
        ease: "power2.out",
      })
      .to(errorBoxRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.4)",
      }, "-=0.1");
    };

    const hideErrorBox = () => {
      if (!errorBoxRef.current) return;

      const tl = gsap.timeline();
      
      tl.to(errorBoxRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      })
      .to(errorBoxRef.current, {
        height: 0,
        marginBottom: 0,
        duration: 0.2,
        ease: "power2.in",
      }, "-=0.1");
    };

    useEffect(() => {
      if (!formContainerRef.current) return;

      gsap.set(formContainerRef.current, {
        y: -100,
        opacity: 0
      });

      gsap.to(formContainerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.2)",
      });
    }, []);

    useEffect(() => {
      if (error && errorBoxRef.current) {
        animateErrorBox();
      } else if (!error && errorBoxRef.current) {
        hideErrorBox();
      }
    }, [error]);

    const handlePageExit = () => {
      return new Promise<void>((resolve) => {
        if (!formContainerRef.current) {
          resolve();
          return;
        }

        const element = formContainerRef.current;
        
        gsap.killTweensOf(element);
        
        gsap.to(element, {
          y: 100,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            resolve();
          }
        });
      });
    };

    useEffect(() => {
      let isNavigating = false;

      const handleClick = async (e: MouseEvent) => {
        if (!e.target) return;
        
        let currentElement = e.target as Node;
        let link: HTMLAnchorElement | null = null;
        
        if (currentElement.nodeType === 1 && (currentElement as Element).tagName === 'A') {
          link = currentElement as HTMLAnchorElement;
        } else {
          while (currentElement && currentElement.parentNode) {
            currentElement = currentElement.parentNode;
            if (currentElement.nodeType === 1 && (currentElement as Element).tagName === 'A') {
              link = currentElement as HTMLAnchorElement;
              break;
            }
          }
        }
        
        if (link && !isNavigating) {
          const href = link.getAttribute('href');
          if (href && (href.startsWith('/') || href.startsWith('#'))) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            isNavigating = true;
            
            try {
              await handlePageExit();
              router.push(href);
            } catch (error) {
              console.error('transition failed.', error);
              router.push(href);
            }
          }
        }
      };

      document.addEventListener('click', handleClick, true);

      return () => {
        document.removeEventListener('click', handleClick, true);
      };
    }, [router]);

  return (
    <ProtectedRoute requireAuth={false}>
      <PageTransition>
      <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
      <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
        <div ref={formContainerRef} className="max-h-[85vh] flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide" style={{transition: 'height 0.3s ease-out, min-height 0.3s ease-out'}}>
          <div className="flex items-center justify-center w-full text-3xl font-bold text-white pb-4">
            註冊
          </div>
          <div 
            ref={errorBoxRef}
            className="w-full max-w-md p-1.5 bg-red-500/20 border-2 border-red-500/60 rounded-full text-red-400 text-sm text-center flex items-center justify-center gap-2"
            style={{display: error ? 'flex' : 'none'}}
          >
            <div className="flex-shrink-0">
              <CircleAlert size={18}/>
            </div>
            <span className="leading-relaxed break-words">
              {error}
            </span>
          </div>
          <div className={`w-full max-w-md flex flex-col items-center ${
            !usernameError && !emailError && !passwordError && !confirmPasswordError ? 'space-y-3.5' : 'space-y-1.5'
          }`} style={{transition: 'gap 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out'}}>
            <div className="w-full origin-center custom-input-trans-animate">
              <CustomInput
                label="使用者名稱"
                size="sm"
                value={username}
                onValueChange={setUsername}
                isDisabled={isLoading}
                isInvalid={!!usernameError}
                errorMessage={`*${usernameError}`}
              />
            </div>
            <div className="w-full origin-center custom-input-trans-animate">
              <CustomInput
                label="電子郵件"
                size="sm"
                type="email"
                value={email}
                onValueChange={setEmail}
                isDisabled={isLoading}
                isInvalid={!!emailError}
                errorMessage={`*${emailError}`}
              />
            </div>
            <div className="relative w-full origin-center custom-input-trans-animate">
              <CustomInput
                label="密碼"
                size="sm"
                type={isPwdVisible ? "text" : "password"}
                className="pr-12"
                value={password}
                onValueChange={setPassword}
                isDisabled={isLoading}
                isInvalid={!!passwordError}
                errorMessage={`*${passwordError}`}
              />
              <Button
                isIconOnly
                variant="light"
                aria-label="切換輸入密碼是否可見"
                className="absolute right-4 top-[26px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                type="button"
                onPress={toggleVisbility}
                isDisabled={isLoading}
              >
                {isPwdVisible ? (
                  <EyeClosed size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </Button>
            </div>
            <div className="relative w-full origin-center custom-input-trans-animate">
              <CustomInput
                label="確認密碼"
                size="sm"
                type={isPwdRepeatVisible ? "text" : "password"}
                className="pr-12"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                isDisabled={isLoading}
                isInvalid={!!confirmPasswordError}
                errorMessage={`*${confirmPasswordError}`}
              />
              <Button
                isIconOnly
                variant="light"
                aria-label="切換再次輸入密碼是否可見"
                className="absolute right-4 top-[26px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                type="button"
                onPress={toggleRepeatVisbility}
                isDisabled={isLoading}
              >
                {isPwdRepeatVisible ? (
                  <EyeClosed size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </Button>
            </div>
            <div className={`flex flex-col items-center justify-center text-xs text-gray-300 ${
              !usernameError && !emailError && !passwordError && !confirmPasswordError ? 'pt-2 pb-0' : 'pt-2 pb-0'
            }`}>
              <div className="text-center">註冊即代表您同意&nbsp;
                <Link href="/privacy-policy" className="text-sky-300 font-bold hover:underline active:scale-95 transition-all duration-200 inline-block">隱私權政策</Link>
                &nbsp;與&nbsp;
                <Link href="/terms-of-service" className="text-sky-300 font-bold hover:underline active:scale-95 transition-all duration-200 inline-block">使用條款</Link>
              </div>
            </div>
            <div className="flex w-full justify-center">
              <CustomButton 
                variant="blur"
                size="lg"
                radius="full"
                startContent={!isLoading ? <LogIn size={20} className="transform transition-all duration-100"/> : undefined}
                className="text-white !text-sm sm:!text-lg bg-blue-500 border-0 px-4 sm:px-6 custom-button-trans-override"
                onPress={handleEmailSignup}
                isLoading={isLoading}
                isDisabled={isLoading}
                spinner={ <Spinner size="sm" color="default"/>}
              >
                Let's Go !
              </CustomButton>
            </div>
            <div className="flex items-center w-full gap-3 text-gray-300 text-base">
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              <span>或者，使用以下方式註冊</span>
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 md:gap-10 font-normal max-w-full">
              <Button
                size="lg"
                radius="full"
                startContent={<FcGoogle size={25} className="flex-shrink-0"/>}
                className="!test-base sm:!text-lg bg-white text-black shadow-2xl custom-button-trans-override px-4 sm:px-6 flex-1 sm:flex-initial"
                onPress={handleGoogleSignup}
                isDisabled={isLoading}
              >
                Google
              </Button>
              <Button
                size="lg"
                radius="full"
                startContent={<FaGithub size={25} color="white" className="flex-shrink-0" />}
                className="!test-base sm:!text-lg bg-zinc-900 text-white shadow-2xl custom-button-trans-override px-4 sm:px-6 flex-1 sm:flex-initial"
                onPress={handleGithubSignup}
                isDisabled={isLoading}
              >
                Github
              </Button>
            </div>
            <Link 
              href="/login" 
              className="active:scale-95 transition-all duration-200 block"
              prefetch={false}
            >
              <div className="flex items-center w-full gap-3 text-gray-300 text-base">
                <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                <span className="text-center">
                  <span className="inline sm:inline">已經有帳號了嗎？</span>
                  <span className="inline-block whitespace-nowrap">&nbsp;<span className="text-sky-300 font-bold hover:underline">立即登入！</span></span>
                </span>
                <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start">
        <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">© 2025 <span className=" text-blue-500 font-bold"><Link href="/" className="hover:underline" prefetch={false}>Share Lock</Link></span>&nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.</p>
      </div>
    </div>
    </PageTransition>
    </ProtectedRoute>
  );
}