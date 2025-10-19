import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, QrCode } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);
  
  // Trigger camera scan when QR modal opens
useEffect(() => {
  if (showQRScanner) {
    startCameraScan();
  } else {
    // Stop camera if modal is closed
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }
}, [showQRScanner]);


  // ----------------- Handle Login -----------------
  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!username.trim()) {
      toast({ title: "Missing Username", description: "Enter username", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!password) {
      toast({ title: "Missing Password", description: "Enter password", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (username.toLowerCase() !== "superadmin" && !pin) {
      toast({ title: "Missing PIN", description: "Enter 4-digit PIN", variant: "destructive" });
      setLoading(false);
      return;
    }

    const isLoggedIn = await login(username.trim(), password, pin);
    if (isLoggedIn) {
      toast({ title: "✅ Login Successful", description: `Welcome ${username}!`, className: "bg-green-500 text-white" });
      setUsername(""); setPassword(""); setPin("");
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      toast({ title: "❌ Login Failed", description: "Invalid credentials", className: "bg-red-500 text-white" });
    }

    setLoading(false);
  };

const handleScanResult = async (text: string) => {
  if (!text) return;

  const data = text.split("|");
  const [qrUsername, qrPassword, qrPin] = data;

  if (!qrUsername || !qrPassword) {
    toast({ title: "Invalid QR Code", description: "Missing required fields", variant: "destructive" });
    return;
  }

  // Fill input fields
  setUsername(qrUsername);
  setPassword(qrPassword);
  setPin(qrPin || "");
  setShowQRScanner(false);

  // ✅ Auto-login
  setLoading(true);
  const isLoggedIn = await login(qrUsername, qrPassword, qrPin || "");
  setLoading(false);

  if (isLoggedIn) {
    toast({ title: "✅ QR Login Successful", description: `Welcome ${qrUsername}!`, className: "bg-green-500 text-white" });
    setTimeout(() => navigate("/dashboard"), 800);
  } else {
    toast({ title: "❌ Login Failed", description: "Invalid QR code credentials.", className: "bg-red-500 text-white" });
  }
};

  // ----------------- Scan from Camera -----------------
  const startCameraScan = async () => {
    if (!videoRef.current) return;
    const codeReader = new BrowserMultiFormatReader();
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
      handleScanResult(result.getText());
      
       // Stop camera after scan
    if (videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
      setCameraActive(false);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera scan failed:", err);
      toast({ title: "Camera Scan Failed", description: "Cannot access camera", variant: "destructive" });
      setCameraActive(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 relative">
      <Card className="w-full max-w-md mx-4 shadow-md border border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full flex items-center justify-center">
              <img src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png" className="h-full w-full" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">POS System</CardTitle>
          <CardDescription>Enter credentials or scan QR to login</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="admin or superadmin" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {username.toLowerCase() !== "superadmin" && (
              <div className="space-y-2 relative">
                <Label htmlFor="pin">PIN (for Admins)</Label>
                <div className="relative">
                  <Input id="pin" type={showPin ? "text" : "password"} placeholder="1234" value={pin} onChange={(e) => setPin(e.target.value)} required />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : "Login"}</Button>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  setShowQRScanner(true);
                  await startCameraScan(); // <-- Start camera immediately
                }}
              >
                <QrCode className="h-4 w-4" /> Login via QR Code
              </Button>

              {showQRScanner && (
                <div className="flex flex-col gap-2 mt-2">
                  {/* Video Preview */}
                  <video ref={videoRef} className="w-full rounded-md mt-2" />
                </div>
              )}


            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
