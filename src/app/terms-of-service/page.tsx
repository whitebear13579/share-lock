"use client";
import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Link,
} from "@heroui/react";
import { Dot, CopyrightIcon } from "lucide-react";

export default function Terms() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
            const checkScreenSize = () => {
                setIsMobile(window.innerWidth < 1000);
            };
    
            checkScreenSize();
            window.addEventListener('resize', checkScreenSize);
    
            return () => window.removeEventListener('resize', checkScreenSize);
        }, []);

    return (
        <div className="flex items-start justify-center min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55%">
            <div className={isMobile ? "w-100% px-7 py-7" : "w-3/5 px-7 py-7"}>
                <div className="">
                    <h1 className="font-bold text-3xl text-gray-100">Terms of Service</h1>
                    <p className="text-gray-300 py-6 px-1"><strong>Last Updated:</strong> November 30, 2025</p>
                    <div>
                        <p className="text-gray-300 px-1">Welcome, and thank you for your interest in <strong>Share Lock</strong> ("Share Lock Team", "we", "our", or "us").<br />These Terms of Service (“Terms”) govern your access to and use of the Share Lock platform, including our website, software, and related services (collectively, the “Service”).</p>
                        <p className="text-gray-300 px-1 py-3">By using the Service, you agree to these Terms.<br />Please also review our <Link href="/privacy-policy" className="text-sky-300 font-bold hover:underline active:scale-95 transition-all duration-200 inline-block">
                            Privacy policy
                        </Link>, which explains how we collect, use, and share personal data.
                        </p>
                        <p className="text-gray-300 px-1 py-3">If you are using the Service on behalf of an organization, you represent that you have the authority to bind that entity to these Terms.</p>
                    </div>
                </div>
                <hr className="text-gray-100"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">1. Access and Use</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold">License Grant</h3>
                                    <p className="text-gray-300 py-2 text-sm">Subject to your compliance with these Terms, Share Lock grants you a limited, non-exclusive, non-transferable, and revocable right to access and use the Service.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">User Content</h3>
                                    <p className="text-gray-300 py-1 text-sm">You may upload documents, inputs, or other content (“Content”) to the Service. You retain ownership of your Content.<br />By submitting Content, you represent and warrant that you have the necessary rights and permissions to share it.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Model Training</h3>
                                    <p className="text-gray-300 py-1 text-sm">Share Lock will not use your private Content for AI model training unless you explicitly provide consent.</p>
                                    </div>
                                    <div className="items-center py-3">
                                        <h3 className="text-gray-300 text-lg font-bold py-1">Limitations of Service</h3>
                                        <p className="text-gray-300 py-1 text-sm">You acknowledge that:</p>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>You are solely responsible for how you use the Service.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>The Service may experience interruptions, delays, or errors, and we do not guarantee continuous, uninterrupted, or error-free operation.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0 "/>We are not liable for any data loss, corruption, or unauthorized access that may occur due to factors beyond our reasonable control, including but not limited to network failures, hardware malfunctions, or third-party attacks.</span>
                                        </div>
                                    </div>
                                    <div className="items-center py-3">
                                        <h3 className="text-gray-300 text-lg font-bold py-1">Restrictions</h3>
                                        <p className="text-gray-300 py-1 text-sm">You may not:</p>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Reverse engineer, decompile, or disassemble the Service.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Use the Service to infringe intellectual property or privacy rights.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0 "/>Use the Service for illegal, fraudulent, or harmful purposes.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0 "/>Attempt to bypass security mechanisms.</span>
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0 "/>Use the Service to upload regulated data (e.g., health, biometric, or financial data) without prior agreement.</span>
                                        </div>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Beta Features</h3>
                                    <p className="text-gray-300 py-1 text-sm">We may offer beta or experimental features. Such features are provided “as is” without warranties and may be discontinued at any time.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">2. Eligibility</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">You must be at least the age of majority in your jurisdiction (18 in most regions) to use the Service.<br />By registering, you represent that you meet eligibility requirements and that your account information is accurate.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">3. Account Registration</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">To use most features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.<br />If you suspect unauthorized use, notify us immediately at @gmail.com.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">4. Ownership and Licenses</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold">Service</h3>
                                    <p className="text-gray-300 py-2 text-sm">Share Lock and its licensors own all rights, title, and interest in the Service, including improvements and intellectual property.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Content</h3>
                                    <p className="text-gray-300 py-1 text-sm">You retain ownership of your Content. Share Lock does not claim rights to your documents beyond those necessary to provide the Service.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Feedback</h3>
                                    <p className="text-gray-300 py-1 text-sm">If you provide feedback or suggestions, Share Lock may use them without obligation to you.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Usage Data</h3>
                                    <p className="text-gray-300 py-1 text-sm">Share Lock may collect and use de-identified or aggregated usage data to improve the Service.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">5. Third-Party Services</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">The Service may integrate with third-party tools (e.g., storage, analytics, communication platforms).<br />Use of third-party services is subject to their own terms. Share Lock is not responsible for third-party practices.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">6. Communications</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">We may send you service-related or promotional emails. You may opt out of promotional messages at any time.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">7. Modifications</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">We may modify these Terms at any time. Updates will be posted with a revised “Last Updated” date.<br />Your continued use constitutes acceptance of the modified Terms.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">8. Termination</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">You may stop using the Service at any time.<br />Share Lock may suspend or terminate access if you violate these Terms or for security/legal reasons.<br />Upon termination, we may delete your Content, except as required by law.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div><hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">9. Copyright Complaints</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">If you believe your intellectual property rights are infringed, contact us at @gmail.com with a DMCA-compliant notice.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">10. Indemnity</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">You agree to indemnify and hold harmless Share Lock, its affiliates, and team members against claims, damages, and expenses arising from your misuse of the Service or violation of these Terms.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">11. Disclaimer of Warranties</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">The Service is provided “as is” and “as available” without warranties of any kind.<br />Share Lock disclaims all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">12. Limitation of Liability</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="items-center py-3">
                                        <p className="text-gray-300 py-1 text-sm">To the fullest extent permitted by law:</p>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Share Lock shall not be liable for any indirect, incidental, or consequential damages.</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Because the Service is provided free of charge, our total liability for any claim arising out of or relating to the Service shall not exceed USD 100.</span>
                                        </div>
                                    </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">13. Dispute Resolution</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold">Governing Law</h3>
                                    <p className="text-gray-300 py-2 text-sm">These Terms are governed by the laws of the applicable jurisdiction, without regard to conflict of law principles.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Arbitration</h3>
                                    <p className="text-gray-300 py-1 text-sm">Any disputes shall be resolved through binding arbitration, unless prohibited by applicable law.</p>
                                    </div>
                                    <div className="items-center py-3">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Class Action Waiver</h3>
                                    <p className="text-gray-300 py-1 text-sm">You agree to bring claims only on an individual basis and not as a plaintiff in any class, collective, or representative action.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">14. Google User Data</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="items-center py-3">
                                        <p className="text-gray-300 py-1 text-sm">If you choose to connect your Google account with Share Lock, the following applies:</p>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Data Collected: We may access your Google account basic profile information (e.g., name, email) and documents explicitly authorized by you.</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Purpose of Use: Such data is used solely to enable login, identify users, and provide document collaboration features.</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>No Selling or Sharing: We do not sell, rent, or share Google user data with third parties for advertising or unrelated purposes.</span>
                                        </div>
                                       <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Limited Use Compliance: We comply with the Google API Services User Data Policy, including the Limited Use requirements.</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><Dot className="text-gray-300 flex-shrink-0"/>Revocation and Deletion: You may revoke Share Lock's access at any time via your Google Account settings. Upon request, we will delete your data from our systems.</span>
                                        </div>
                                    </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">15. Miscellaneous</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">These Terms, together with our Privacy Policy, are the entire agreement between you and Share Lock.<br />If any provision is invalid, the remaining provisions remain enforceable.<br />Share Lock's failure to enforce any right is not a waiver.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <div className="py-3">
                            <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-300">16. Contact</h4>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-1">
                                <div className="px-1">
                                    <div className="items-center py-3">
                                    <p className="text-gray-300 py-2 text-sm">These Terms, together with our Privacy PoFor questions about these Terms, contact us:</p>
                                    </div>
                                    <div className="items-center py-1">
                                    <p className="text-gray-300 py-2 text-sm">Email: @gmail.com</p>
                                    </div>
                                </div>
                            </CardBody>
                        </div>
                    </Card>
                </div>
                <hr className="text-gray-100"></hr>
                <div className="flex flex-col py-4">
                    <span className="text-gray-300 py-0 text-sm flex flex-row items-start"><CopyrightIcon className="py-1 size-5.5 text-gray-300 flex-shrink-0"/> 2025 Share Lock Team. All rights reserved.</span>
                </div>
            </div>
        </div>
    );
}
