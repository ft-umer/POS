import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (user.role === "superadmin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || (username.toLowerCase() !== "superadmin" && !pin)) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    const isLoggedIn = login(username.trim(), password, pin);

    if (isLoggedIn) {
      toast({
        title: "Login Successful",
        description: `Welcome ${username}!`,
      });
      setUsername("");
      setPassword("");
      setPin("");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username, password, or PIN.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md mx-4 shadow-md border border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">POS System</CardTitle>
          <CardDescription>Enter your credentials to access the system</CardDescription>
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

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
            <p>Demo credentials:</p>
            <p>SuperAdmin → Username: superadmin | Password: 123456</p>
            <p>Admin → Username: admin1/admin2/admin3 | Password: 123456 | PIN: 1111/2222/3333</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
