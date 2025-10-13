"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const AdminList = () => {
  const { user, users } = useAuth();

  // ✅ Always filter live admins from context
  const admins = useMemo(() => {
    return (users || []).filter((u) => u.role === "admin");
  }, [users]);

  if (user?.role !== "superadmin") {
    return (
      <div className="text-center text-gray-600 py-20">
        Only SuperAdmin can view this page.
      </div>
    );
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-white text-gray-900">
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
            All Admins
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
                        key={admin.username}
                        className={`transition-colors hover:bg-orange-50/40 ${
                          isOnline
                            ? "bg-green-50" // 💚 highlight online admins
                            : "bg-red-50/30" // 🔴 subtle tint for offline
                        }`}
                      >
                        <TableCell className="font-medium text-gray-800">
                          {admin.username}
                        </TableCell>
                        <TableCell className="text-gray-700">{admin.site}</TableCell>
                        <TableCell className="text-gray-700">{admin.pin}</TableCell>
                        <TableCell className="text-gray-700">
                          {formatDateTime(admin.lastLogin)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatDateTime(admin.lastLogout)}
                        </TableCell>
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
