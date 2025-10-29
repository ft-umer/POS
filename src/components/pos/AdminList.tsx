"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";


const AdminList = () => {
  const { user, users, fetchUsers, token } = useAuth();
  const [formData, setFormData] = useState({ username: "", pin: "", site: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrForAdmin, setQrForAdmin] = useState<string | null>(null);

  const admins = useMemo(() => (users || []).filter((u) => u.role === "admin"), [users]);

  // 🧩 NEW: Admin Activity State
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Auto-refresh admin list every 10s
  useEffect(() => {
    if (user?.role === "superadmin") {
      fetchUsers(); // initial fetch
      const interval = setInterval(fetchUsers, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUsers]);

  // 🧩 NEW: Fetch Admin Activity every 15s
  useEffect(() => {
    if (user?.role === "superadmin" && token) {
      const fetchActivity = async () => {
        try {
          setActivityLoading(true);
          const res = await fetch("https://pos-backend-kappa.vercel.app/activity", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) setActivities(data);
        } catch (err) {
          console.error("Error fetching admin activity:", err);
        } finally {
          setActivityLoading(false);
        }
      };

      fetchActivity();
      const interval = setInterval(fetchActivity, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

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
      const adminData = {
        ...formData,
        password: "123456", // default password
        role: "admin",
      };

      const res = await fetch("https://pos-backend-kappa.vercel.app/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(adminData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error adding admin");
      } else {
        setSuccess("Admin added successfully");

        const qrString = `${adminData.username}|${adminData.password}|${adminData.pin}`;
        setQrForAdmin(qrString);

        setFormData({ username: "", pin: "", site: "" });
        fetchUsers();
      }
    } catch (err) {
      setError("Server error while adding admin");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <><div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      {/* Add Admin Form */}
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

      {/* Admin List Table */}
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const isOnline = admin.lastLogin && (!admin.lastLogout || admin.lastLogin > admin.lastLogout);
                    const qrString = `${admin.username}|123456|${admin.pin}`;

                    return (
                      <TableRow
                        key={admin._id}
                        className={`transition-colors hover:bg-orange-50/40 ${isOnline ? "bg-green-50" : "bg-red-50/30"}`}
                      >
                        <TableCell className="font-medium text-gray-800">{admin.username}</TableCell>
                        <TableCell className="text-gray-700">{admin.site}</TableCell>
                        <TableCell className="text-gray-700">{admin.pin}</TableCell>
                        <TableCell className="text-gray-700">{formatDateTime(admin.lastLogin)}</TableCell>
                        <TableCell className="text-gray-700">{formatDateTime(admin.lastLogout)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${isOnline
                                ? "border-green-200 text-green-600 bg-green-50"
                                : "border-red-200 text-red-600 bg-red-50"}`}
                          >
                            {isOnline ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>

                        {/* Show QR code in table */}


                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `https://pos-backend-kappa.vercel.app/users/${admin._id}`,
                                  {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${token}` },
                                  }
                                );

                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || "Failed to delete admin");

                                toast({
                                  title: "Admin Deleted",
                                  description: `${admin.username} was removed successfully.`,
                                });

                                fetchUsers(); // refresh list
                              } catch (err) {
                                console.error(err);
                                toast({
                                  variant: "destructive",
                                  title: "Delete Failed",
                                  description: "There was an error deleting this admin. Please try again.",
                                });
                              }
                            } }
                          >
                            Delete
                          </Button>
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

      {/* 🧩 NEW: Admin Activity Log Section */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
            Admin Activity Log {activityLoading && <span className="text-sm text-gray-500">(Loading...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-5">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No activity recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-100">
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium text-gray-800">{a.username}</TableCell>
                      <TableCell className="text-gray-700">{a.action}</TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(a.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  
    </>
  );
};

export default AdminList;
