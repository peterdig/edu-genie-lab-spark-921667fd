import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";

const APP_CONFIG = {
    version: "2.0.1",
    size: "56.6 MB",
    lastUpdated: "May 13, 2025",
    minAndroidVersion: "8.0",
    apkFileName: "EdGenie-mobile.apk",
    apkPath: "/assets/EdGenie-mobile.apk"
};

const APP_FEATURES = [
    {
        title: "Offline Access",
        description: "Access your lessons and resources without internet"
    },
    {
        title: "Fast & Responsive",
        description: "Optimized performance for smooth experience"
    },
    {
        title: "Secure Data",
        description: "End-to-end encryption for your content"
    }
];

export default function MobileDownload() {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);

        try {
            const downloadUrl = `${window.location.origin}${APP_CONFIG.apkPath}`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = APP_CONFIG.apkFileName;
            link.setAttribute('download', APP_CONFIG.apkFileName);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Download started!");
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Failed to start download. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Layout>
            <div className="w-full max-w-3xl mx-auto space-y-6">
                {/* App Info Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">EdGenie Mobile App</h1>
                    <p className="text-muted-foreground">
                        Take your teaching tools wherever you go
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Download Card */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Android App <span className="text-sm font-normal text-muted-foreground ml-2">v{APP_CONFIG.version}</span>
                            </CardTitle>
                            <CardDescription>
                                Download the EdGenie Android app
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>File size: {APP_CONFIG.size}</p>
                                <p>Last updated: {APP_CONFIG.lastUpdated}</p>
                                <p>Requires Android {APP_CONFIG.minAndroidVersion} or higher</p>
                            </div>
                            <Button
                                className="w-full relative"
                                onClick={handleDownload}
                                disabled={downloading}
                            >
                                {downloading ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        <span>Preparing Download...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download APK
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Features Card */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Key Features</CardTitle>
                            <CardDescription>
                                What makes EdGenie mobile special
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {APP_FEATURES.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                            <h3 className="font-medium">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Installation Steps */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Installation Guide</CardTitle>
                        <CardDescription>
                            Follow these steps to install EdGenie on your Android device
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Download the APK file using the button above</li>
                            <li>Open your device's Settings app</li>
                            <li>Enable "Install from Unknown Sources" for your browser</li>
                            <li>Open the downloaded APK file</li>
                            <li>Follow the on-screen installation prompts</li>
                            <li>Once installed, open EdGenie and log in with your account</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}