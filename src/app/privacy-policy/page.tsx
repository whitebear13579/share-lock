"use client";
import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Link,
} from "@heroui/react";
import { Dot } from "lucide-react";

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
                    <h1 className="font-bold text-3xl text-gray-100">Privacy Policy</h1>
                    <p className="text-gray-300 py-6 px-1"><strong>Last Updated:</strong> December 1, 2025</p>
                    <div>
                        <p className="text-gray-300 px-1">Welcome, and thank you for your interest in <strong>Share Lock</strong> (&quot;Share Lock Team&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).<br />We are strongly committed to respecting your privacy and keeping secure any information you share with us.</p>
                        <p className="text-gray-300 px-1 py-3">This Privacy Policy explains how we collect, use, and share your personal data, and describes the rights that may be available to you under applicable law.<br />Please also review our <Link href="/terms-of-service" className="text-sky-300 font-bold hover:underline active:scale-95 transition-all duration-200 inline-block">
                            Terms of Service
                        </Link>, which explain the rules for using the service, and clarify the rights and responsibilities of both the service provider and the users.
                        </p>
                        <p className="text-gray-300 px-1 py-3">If you are using the Service on behalf of an organization, you represent that you have the authority to bind that entity to these Terms.</p>
                    </div>
                </div>
                <hr className="text-gray-100"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">1. Personal Data We Collect</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                        <h3 className="text-gray-300 text-lg font-bold">Data You Provide to Us Directly</h3>
                                            <ol className="text-gray-300 py-2 text-sm">
                                                <li><strong>Account Information:</strong> name, email, password, organization.</li>
                                                <li><strong>Payment Information:</strong> payment method, billing address, and related details if you use paid services.</li>
                                                <li><strong>Inputs &amp; Content:</strong> documents, feedback, or information you voluntarily submit through the Service.</li>
                                                <li><strong>Communication Information:</strong> messages, inquiries, or support requests.</li>
                                                <li><strong>Feedback:</strong> feature requests, survey responses, or ratings you provide.</li>
                                            </ol>
                                    </div>
                                    <div className="items-center">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Data Collected Automatically</h3>
                                        <ol className="text-gray-300 py-2 text-sm">
                                            <li><strong>Device Information:</strong> device type, browser type, operating system.</li>
                                            <li><strong>Log Information:</strong> IP address, access times, error logs, and interactions with the Service.</li>
                                            <li><strong>Usage Data:</strong> browsing history, clicks, document activities, and preferences.</li>
                                            <li><strong>Cookies &amp; Similar Technologies:</strong> used for functionality, analytics, and personalization.</li>
                                            <li><strong>Location Information:</strong> approximate location (e.g., for fraud detection, login security).</li>
                                        </ol>
                                    </div>
                                    <div className="items-center">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">Information We Do Not Collect</h3>
                                        <ol className="text-gray-300 py-2 text-sm">
                                            <li>Sensitive categories such as biometric data, health data, or government IDs.</li>
                                            <li>Data from children under 13 (or 18 where local law applies). If we discover such collection, we delete it promptly.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">2. How We Use Personal Data</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg font-bold">We may use personal data for the following purposes:</h3>
                                        <ol className="text-gray-300 py-2 text-sm">
                                            <li>Provide and Maintain Services: operate the Share Lock platform, including collaboration and version-tracking features.</li>
                                            <li>Account &amp; Payments: create and administer accounts, process billing.</li>
                                            <li>Improve Services: debug, test, and enhance platform functionality.</li>
                                            <li>Communicate about updates or inquiries: send updates, respond to inquiries, and notify about changes.</li>
                                            <li>Security and fraud detection: prevent, detect, and investigate fraud, abuse, or policy violations.</li>
                                            <li>Legal compliance: comply with applicable laws and enforce agreements.</li>
                                            <li>Research &amp; Development: aggregate or de-identify usage data for analytics and product improvements.</li>
                                        </ol>
                                </div>
                                <div className="items-center">
                                    <h3 className="text-gray-300 text-lg font-bold py-1">We do not use your private documents or inputs for model training unless:</h3>
                                        <ol className="text-gray-300 py-2 text-sm">
                                            <li>They are flagged for security review.</li>
                                            <li>You explicitly consent.</li>
                                            <li>They are provided as feedback for product improvement.</li>
                                        </ol>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">3. How We Share Personal Data</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg font-bold">We may disclose personal data in the following circumstances:</h3>
                                    <ol className="text-gray-300 py-2 text-sm">
                                        <li><strong>Service Providers:</strong> hosting, analytics, payment processors, customer support, and security vendors.</li>
                                        <li><strong>Business Partners:</strong> integrations, joint offerings, or collaboration features you choose to use.</li>
                                        <li><strong>Authorized Users:</strong> collaborators or organizations you explicitly share documents with.</li>
                                        <li><strong>Legal Authorities:</strong> if required by law, regulation, or court order.</li>
                                        <li><strong>Business Transfers:</strong> during mergers, acquisitions, or restructuring events.</li>
                                        <li><strong>With Your Consent:</strong> when you approve data sharing (e.g., integrations with third-party tools).</li>
                                    </ol>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">4. Data Retention</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg">We retain your personal data only as long as necessary for operating the Service, legal compliance, security, and dispute resolution. When no longer needed, data will be securely deleted, de-identified, or anonymized.</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">5. Security</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg">We implement commercially reasonable technical, organizational, and administrative measures to protect personal data from loss, misuse, and unauthorized access. However, no system is 100% secure. Please take care in safeguarding your account credentials.</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">6. Your Rights and Choices</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg font-bold">Depending on your jurisdiction, you may have the following rights:</h3>
                                    <ol className="text-gray-300 py-2 text-sm">
                                        <li><strong>Access:</strong>request a copy of your personal data.</li>
                                        <li><strong>Correction:</strong>request updates to inaccurate or incomplete data.</li>
                                        <li><strong>Deletion:</strong>request erasure of your personal data, subject to exceptions.</li>
                                        <li><strong>Portability:</strong>request your data in a portable format.</li>
                                        <li><strong>Objection / Restriction:</strong>object to processing or request limitations.</li>
                                        <li><strong>Withdraw Consent:</strong>where processing is based on consent, you may withdraw at any time.</li>
                                    </ol>
                                    <h3 className="text-gray-300 text-lg font-bold">We will not discriminate against you for exercising your privacy rights.</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">7. Privacy Policy Changes</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg">We may update this Privacy Policy from time to time. If changes are significant, we will notify you via email, in-app notification, or through our website. Your continued use of Share Lock after updates indicates your acceptance of the revised Policy.</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">8. Personal Data of Children</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg">Share Lock does not knowingly collect information from children under 13. If we learn that we have collected such data, we will delete it promptly. Parents or guardians may contact us for removal.</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-500 border-dashed"></hr>
                <div className="py-4">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-2 pt-4 px-6 flex-row gap-3">
                            <div>
                                <h4 className="font-bold text-xl text-gray-300">9. Contact Us</h4>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-1">
                            <div className="ml-6">
                            <div className="px-1">
                                <div className="items-center py-2 py-1">
                                    <h3 className="text-gray-300 text-lg">If you have any questions, requests, or concerns regarding this Privacy Policy:</h3>
                                    <h3 className="text-gray-300 text-lg font-bold">contact@sharelock.qzz.io</h3>
                                </div>
                            </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <hr className="text-gray-100"></hr>
                <br />
                <h3 className="text-gray-300 text-lg">© 2025 Share Lock. All Rights Reserved.</h3>
            </div>
        </div>
    );
}
