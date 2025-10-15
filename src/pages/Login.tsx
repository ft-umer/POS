import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return; // Prevent multiple clicks
    setLoading(true);

    // 🧾 Validate fields one by one for better UX
    if (!username.trim()) {
      toast({
        title: "Missing Username",
        description: "Please enter your username.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!password) {
      toast({
        title: "Missing Password",
        description: "Please enter your password.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // PIN required only for admins (not superadmin)
    if (username.toLowerCase() !== "superadmin" && !pin) {
      toast({
        title: "Missing PIN",
        description: "Please enter your 4-digit PIN.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // 🧠 Try login
    const isLoggedIn = await login(username.trim(), password, pin);

    if (isLoggedIn) {
      toast({
        title: "✅ Login Successful",
        description: `Welcome ${username}!`,
        className: "bg-green-500 text-white",
      });
      setUsername("");
      setPassword("");
      setPin("");
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      toast({
        title: "❌ Login Failed",
        description: "Invalid username, password, or PIN.",
        className: "bg-red-500 text-white",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md mx-4 shadow-md border border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full flex items-center justify-center">
              <img
                src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png"
                className="h-full w-full"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">POS System</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin or superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {username.toLowerCase() !== "superadmin" && (
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (for Admins)</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
