"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AdminList = () => {
  const { user, users, fetchUsers, token } = useAuth();
  const [formData, setFormData] = useState({ username: "", pin: "", site: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const admins = useMemo(() => (users || []).filter((u) => u.role === "admin"), [users]);

  // ✅ Auto-refresh admin list every 10 seconds
  useEffect(() => {
    if (user?.role === "superadmin") {
      fetchUsers(); // initial fetch
      const interval = setInterval(fetchUsers, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user, fetchUsers]);

  if (user?.role !== "superadmin") {
    return <div className="text-center text-gray-600 py-20">Only SuperAdmin can view this page.</div>;
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error adding admin");
      } else {
        setSuccess("Admin added successfully");
        setFormData({ username: "", pin: "", site: "" });
        fetchUsers(); // refresh list immediately
      }
    } catch (err) {
      setError("Server error while adding admin");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      {/* === Add Admin === */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">Add Admin</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Username" name="username" value={formData.username} onChange={handleChange} required />
            <Input placeholder="PIN" name="pin" value={formData.pin} onChange={handleChange} required />
            <Input placeholder="Site" name="site" value={formData.site} onChange={handleChange} required />
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Admin"}
            </Button>
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
          </form>
        </CardContent>
      </Card>

      {/* === Admin List === */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
            All Admins (Auto-refreshing)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          {admins.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No admins found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-100">
                    <TableHead>Username</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Last Logout</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const isOnline =
                      admin.lastLogin && (!admin.lastLogout || admin.lastLogin > admin.lastLogout);

                    return (
                      <TableRow
                        key={admin._id}
                        className={`transition-colors hover:bg-orange-50/40 ${
                          isOnline ? "bg-green-50" : "bg-red-50/30"
                        }`}
                      >
                        <TableCell className="font-medium text-gray-800">{admin.username}</TableCell>
                        <TableCell className="text-gray-700">{admin.site}</TableCell>
                        <TableCell className="text-gray-700">{admin.pin}</TableCell>
                        <TableCell className="text-gray-700">{formatDateTime(admin.lastLogin)}</TableCell>
                        <TableCell className="text-gray-700">{formatDateTime(admin.lastLogout)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              isOnline
                                ? "border-green-200 text-green-600 bg-green-50"
                                : "border-red-200 text-red-600 bg-red-50"
                            }`}
                          >
                            {isOnline ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminList;
